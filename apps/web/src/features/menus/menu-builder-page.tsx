import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import { useMenuDetail } from "./use-menus";
import { MenuStatusBadge } from "./menu-status-badge";
import { SectionCard } from "./section-card";

/** /dashboard/menus/:menuId — the draft menu builder (DESIGN.md §10). */
export function MenuBuilderPage() {
  const { menuId } = useParams<{ menuId: string }>();
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const { menu, loading, error, refresh } = useMenuDetail(restaurantId, menuId);

  const [newSection, setNewSection] = useState("");
  const [adding, setAdding] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  const call = async (path: string, init: { method: string; body?: string }) => {
    const rid = restaurantId;
    const mid = menuId;
    if (!rid || !mid) throw new Error("No restaurant or menu selected.");
    const token = await getToken();
    return apiFetch(`/api/v1/restaurants/${rid}/menus/${mid}${path}`, {
      ...init,
      token,
    });
  };

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setActionError(null);
    try {
      await call("/sections", { method: "POST", body: JSON.stringify({ name: newSection }) });
      setNewSection("");
      await refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to add section.");
    } finally {
      setAdding(false);
    }
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    if (!menu) return;
    const ids = menu.sections.map((s) => s.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    const a = ids[index];
    const b = ids[target];
    if (a === undefined || b === undefined) return;
    const next = [...ids];
    next[index] = b;
    next[target] = a;
    setBusy(true);
    setActionError(null);
    try {
      await call("/sections/order", { method: "PUT", body: JSON.stringify({ sectionIds: next }) });
      await refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Reorder failed.");
    } finally {
      setBusy(false);
    }
  };

  const draftItemCount =
    menu?.sections.reduce((n, s) => n + s.items.length, 0) ?? 0;

  const publish = async () => {
    setPublishing(true);
    setActionError(null);
    try {
      await call("/publish", { method: "POST" });
      setPublishOpen(false);
      await refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await call("/unpublish", { method: "POST" });
      await refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unpublish failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="text-sm text-text-secondary">
        <Link to="/dashboard/menus" className="hover:text-brand-primary">
          ← Menus
        </Link>
      </nav>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading menu…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : menu ? (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-text-primary">{menu.name}</h1>
                <MenuStatusBadge status={menu.status} />
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {menu.sections.length} sections · {draftItemCount} items
                {menu.currentRevision &&
                  ` · live version published ${new Date(menu.currentRevision.publishedAt).toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {menu.status === "PUBLISHED" ? (
                <button
                  type="button"
                  onClick={() => void unpublish()}
                  disabled={busy}
                  className="h-11 rounded-xl border border-border-default px-5 text-sm font-medium text-text-primary hover:border-text-secondary disabled:opacity-60"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPublishOpen(true)}
                  className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover"
                >
                  Publish menu
                </button>
              )}
            </div>
          </section>

          {actionError && <p className="text-sm text-error">{actionError}</p>}

          <div className="space-y-4">
            {menu.sections.map((section, index) => (
              <SectionCard
                key={section.id}
                restaurantId={current.restaurant.id}
                menuId={menu.id}
                section={section}
                canMoveUp={index > 0}
                canMoveDown={index < menu.sections.length - 1}
                onMove={(direction) => void moveSection(index, direction)}
                onChanged={() => void refresh()}
              />
            ))}
          </div>

          <form
            onSubmit={addSection}
            className="flex flex-wrap items-end gap-3 rounded-card border border-border-default bg-surface-primary p-4"
          >
            <label className="block text-sm font-medium text-text-primary">
              New section
              <input
                required
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Starters"
                className="mt-1 h-11 w-64 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
              />
            </label>
            <button
              type="submit"
              disabled={adding}
              className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add section"}
            </button>
          </form>

          <Dialog.Root open={publishOpen} onOpenChange={setPublishOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-modal border border-border-default bg-surface-primary p-6 shadow-xl focus:outline-none">
                <Dialog.Title className="text-lg font-semibold text-text-primary">
                  Publish “{menu.name}”?
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-text-secondary">
                  Customers will see this version. You can keep editing the
                  draft afterwards — changes go live only when you publish
                  again.
                </Dialog.Description>
                <div className="mt-4 rounded-lg bg-surface-secondary p-3 text-sm text-text-secondary">
                  {menu.sections.length} sections · {draftItemCount} items
                  {menu.currentRevision &&
                    ` (live now: ${menu.currentRevision.sectionCount} sections · ${menu.currentRevision.itemCount} items)`}
                </div>
                {actionError && publishOpen && (
                  <p className="mt-3 text-sm text-error">{actionError}</p>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-text-primary hover:border-text-secondary"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={() => void publish()}
                    disabled={publishing}
                    className="h-10 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
                  >
                    {publishing ? "Publishing…" : "Publish"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      ) : null}
    </div>
  );
}
