import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import { useMenusList } from "./use-menus";
import { MenuStatusBadge } from "./menu-status-badge";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";

/** /dashboard/menus — list, create, activate and archive menus. */
export function MenusPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const canEdit =
    current?.role === "OWNER" ||
    current?.role === "ADMIN" ||
    current?.role === "MANAGER";
  const { menus, loading, error, refresh } = useMenusList(restaurantId);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  const createMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setCreating(true);
    setFormError(null);
    try {
      await apiFetch(`/api/v1/restaurants/${restaurantId}/menus`, {
        method: "POST",
        token: await getToken(),
        body: JSON.stringify({ name }),
      });
      setName("");
      setNotice(null);
      await refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create menu.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (menuId: string, isActive: boolean) => {
    if (!restaurantId) return;
    setNotice(null);
    try {
      await apiFetch(`/api/v1/restaurants/${restaurantId}/menus/${menuId}`, {
        method: "PATCH",
        token: await getToken(),
        body: JSON.stringify({ isActive: !isActive }),
      });
      await refresh();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const confirmArchive = async () => {
    if (!restaurantId || !archiveTarget) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/restaurants/${restaurantId}/menus/${archiveTarget}`, {
        method: "DELETE",
        token: await getToken(),
      });
      setArchiveTarget(null);
      await refresh();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Menus</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Build your menu as a draft, then publish it for customers.
          </p>
        </div>
      </section>

      {canEdit && (
        <form
          onSubmit={createMenu}
          className="flex flex-wrap items-end gap-3 rounded-card border border-border-default bg-surface-primary p-4"
        >
          <label className="block text-sm font-medium text-text-primary">
            New menu
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lunch Menu"
              className="mt-1 h-11 w-64 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create menu"}
          </button>
          {formError && <p className="text-sm text-error">{formError}</p>}
        </form>
      )}

      {notice && <p className="text-sm text-error">{notice}</p>}
      {loading ? (
        <p className="text-sm text-text-secondary">Loading menus…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : menus.length === 0 ? (
        <div className="rounded-card border border-border-default bg-surface-primary p-10 text-center">
          <p className="font-medium text-text-primary">No menus yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Create your first menu and start serving your customers digitally.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {menus.map((menu) => (
            <li
              key={menu.id}
              className="flex flex-wrap items-center gap-4 rounded-card border border-border-default bg-surface-primary p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/dashboard/menus/${menu.id}`}
                    className="truncate font-semibold text-text-primary hover:text-brand-primary"
                  >
                    {menu.name}
                  </Link>
                  <MenuStatusBadge status={menu.status} />
                  {!menu.isActive && (
                    <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {menu._count.sections} sections · {menu.itemCount} items
                  {menu.currentRevision &&
                    ` · published ${new Date(menu.currentRevision.publishedAt).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => void toggleActive(menu.id, menu.isActive)}
                      className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-text-primary hover:border-text-secondary"
                    >
                      {menu.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(menu.id)}
                      className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-error hover:border-error"
                    >
                      Delete
                    </button>
                  </>
                )}
                <Link
                  to={`/dashboard/menus/${menu.id}`}
                  className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-hover"
                >
                  Open builder
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Delete this menu?"
        description="The menu will be removed from your dashboard. Customers will no longer see it. This cannot be undone."
        confirmLabel="Delete menu"
        destructive
        busy={busy}
        onConfirm={() => void confirmArchive()}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
