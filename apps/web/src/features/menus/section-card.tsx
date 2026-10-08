import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { MenuItemNode, MenuSectionNode } from "./menu.types";
import { formatPrice } from "./format-price";
import { ItemEditorDialog } from "./item-editor-dialog";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";

interface Props {
  restaurantId: string;
  menuId: string;
  section: MenuSectionNode;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  onChanged: () => void;
}

const TAG_LABELS: Record<string, string> = {
  VEG: "Veg",
  NON_VEG: "Non-veg",
  VEGAN: "Vegan",
  SPICY: "Spicy",
  GLUTEN_FREE: "GF",
};

export function SectionCard({
  restaurantId,
  menuId,
  section,
  canMoveUp,
  canMoveDown,
  onMove,
  onChanged,
}: Props) {
  const { getToken } = useAuth();
  const [editor, setEditor] = useState<{
    item: MenuItemNode | null;
  } | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteSectionOpen, setDeleteSectionOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (path: string, init: { method: string; body?: string }) => {
    const token = await getToken();
    return apiFetch(
      `/api/v1/restaurants/${restaurantId}/menus/${menuId}${path}`,
      { ...init, token }
    );
  };

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const rename = (name: string) =>
    run(() => call(`/sections/${section.id}`, { method: "PATCH", body: JSON.stringify({ name }) }));

  const toggleHidden = () =>
    run(() =>
      call(`/sections/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isHidden: !section.isHidden }),
      })
    );

  const removeSection = () =>
    run(() => call(`/sections/${section.id}`, { method: "DELETE" })).then(() =>
      setDeleteSectionOpen(false)
    );

  const toggleItemAvailability = (item: MenuItemNode) =>
    run(() =>
      call(`/sections/${section.id}/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      })
    );

  const removeItem = () => {
    if (!deleteItemId) return;
    return run(() =>
      call(`/sections/${section.id}/items/${deleteItemId}`, { method: "DELETE" })
    ).then(() => setDeleteItemId(null));
  };

  return (
    <section className="rounded-card border border-border-default bg-surface-primary">
      <header className="flex flex-wrap items-center gap-2 border-b border-border-default px-4 py-3">
        <input
          aria-label="Section name"
          defaultValue={section.name}
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (next && next !== section.name) void rename(next);
          }}
          className="h-10 min-w-40 flex-1 rounded-lg border border-transparent px-2 text-base font-semibold text-text-primary outline-none hover:border-border-default focus:border-brand-primary"
        />
        {section.isHidden && (
          <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
            Hidden
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move section up"
            disabled={!canMoveUp || busy}
            onClick={() => onMove(-1)}
            className="h-9 w-9 rounded-lg border border-border-default text-sm text-text-secondary hover:border-text-secondary disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move section down"
            disabled={!canMoveDown || busy}
            onClick={() => onMove(1)}
            className="h-9 w-9 rounded-lg border border-border-default text-sm text-text-secondary hover:border-text-secondary disabled:opacity-40"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => void toggleHidden()}
            disabled={busy}
            className="h-9 rounded-lg border border-border-default px-3 text-sm text-text-secondary hover:border-text-secondary disabled:opacity-40"
          >
            {section.isHidden ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={() => setDeleteSectionOpen(true)}
            disabled={busy}
            className="h-9 rounded-lg border border-border-default px-3 text-sm text-error hover:border-error disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </header>

      <ul className="divide-y divide-border-default">
        {section.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-12 w-12 rounded-lg border border-border-default object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-secondary text-text-secondary"
              >
                ◻
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    item.isAvailable
                      ? "font-medium text-text-primary"
                      : "font-medium text-text-secondary line-through"
                  }
                >
                  {item.name}
                </span>
                {item.dietaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-primary-soft px-2 py-0.5 text-xs font-medium text-brand-primary"
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-text-secondary">
                {formatPrice(item.price)}
                {item.variants.length > 0 && ` · ${item.variants.length} variants`}
                {item.addons.length > 0 && ` · ${item.addons.length} add-ons`}
              </p>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={item.isAvailable}
                onChange={() => void toggleItemAvailability(item)}
                className="h-4 w-4 accent-brand-primary"
              />
              Available
            </label>
            <button
              type="button"
              onClick={() => setEditor({ item })}
              className="h-9 rounded-lg border border-border-default px-3 text-sm font-medium text-text-primary hover:border-text-secondary"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteItemId(item.id)}
              className="h-9 rounded-lg border border-border-default px-3 text-sm text-error hover:border-error"
            >
              Delete
            </button>
          </li>
        ))}
        {section.items.length === 0 && (
          <li className="px-4 py-4 text-sm text-text-secondary">
            No items yet — add your first dish to this section.
          </li>
        )}
      </ul>

      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => setEditor({ item: null })}
          className="h-10 rounded-lg border border-dashed border-border-default px-4 text-sm font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary"
        >
          Add item
        </button>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </div>

      {editor && (
        <ItemEditorDialog
          restaurantId={restaurantId}
          menuId={menuId}
          sectionId={section.id}
          item={editor.item}
          open
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onSaved={onChanged}
        />
      )}

      <ConfirmDialog
        open={deleteSectionOpen}
        title={`Delete “${section.name}”?`}
        description="All items in this section will be removed from the draft. The published menu is unaffected until you publish again."
        confirmLabel="Delete section"
        destructive
        busy={busy}
        onConfirm={() => void removeSection()}
        onCancel={() => setDeleteSectionOpen(false)}
      />
      <ConfirmDialog
        open={deleteItemId !== null}
        title="Delete this item?"
        description="The item will be removed from the draft. The published menu is unaffected until you publish again."
        confirmLabel="Delete item"
        destructive
        busy={busy}
        onConfirm={() => void removeItem()}
        onCancel={() => setDeleteItemId(null)}
      />
    </section>
  );
}
