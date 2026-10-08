import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { DietaryTag, ItemFormValue, MenuItemNode } from "./menu.types";
import { OptionRowsEditor, type OptionRow } from "./option-rows-editor";
import { ItemImageUpload } from "./item-image-upload";

interface Props {
  restaurantId: string;
  menuId: string;
  sectionId: string;
  /** null → create mode. */
  item: MenuItemNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful save (and image upload). */
  onSaved: () => void;
}

const TAGS: { value: DietaryTag; label: string }[] = [
  { value: "VEG", label: "Veg" },
  { value: "NON_VEG", label: "Non-veg" },
  { value: "VEGAN", label: "Vegan" },
  { value: "SPICY", label: "Spicy" },
  { value: "GLUTEN_FREE", label: "Gluten-free" },
];

const inputClass =
  "mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary";

function toForm(item: MenuItemNode | null): ItemFormValue {
  return {
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item ? String(item.price) : "",
    isAvailable: item?.isAvailable ?? true,
    dietaryTags: item?.dietaryTags ?? [],
    variants:
      item?.variants.map((v) => ({
        name: v.name,
        price: String(v.price),
        isAvailable: v.isAvailable,
      })) ?? [],
    addons:
      item?.addons.map((a) => ({
        name: a.name,
        price: String(a.price),
        isAvailable: a.isAvailable,
      })) ?? [],
  };
}

function cleanRows(rows: OptionRow[]) {
  return rows
    .filter((r) => r.name.trim() !== "")
    .map((r) => ({ ...r, price: r.price === "" ? "0" : r.price }));
}

/** Create/edit dialog for menu items (DESIGN.md §10.3). */
export function ItemEditorDialog({
  restaurantId,
  menuId,
  sectionId,
  item,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { getToken } = useAuth();
  const [form, setForm] = useState<ItemFormValue>(() => toForm(item));
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form every time the dialog opens for a different item.
  useEffect(() => {
    if (open) {
      setForm(toForm(item));
      setStagedFile(null);
      setError(null);
    }
  }, [open, item]);

  const toggleTag = (tag: DietaryTag) => {
    setForm((f) => ({
      ...f,
      dietaryTags: f.dietaryTags.includes(tag)
        ? f.dietaryTags.filter((t) => t !== tag)
        : [...f.dietaryTags, tag],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price || "0"),
      isAvailable: form.isAvailable,
      dietaryTags: form.dietaryTags,
      variants: cleanRows(form.variants),
      addons: cleanRows(form.addons),
    };
    try {
      const token = await getToken();
      const saved = await apiFetch<{ id: string }>(
        item
          ? `/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items/${item.id}`
          : `/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items`,
        { method: item ? "PATCH" : "POST", token, body: JSON.stringify(body) }
      );
      if (stagedFile) {
        const formData = new FormData();
        formData.append("file", stagedFile);
        await apiFetch(
          `/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items/${saved.id}/image`,
          { method: "POST", token, body: formData }
        );
      }
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-modal border border-border-default bg-surface-primary p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-text-primary">
            {item ? "Edit item" : "Add item"}
          </Dialog.Title>

          <form onSubmit={submit} className="mt-4 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-text-primary">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Butter Chicken"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-text-primary">
                Price
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="320"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-text-primary">
              Description
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Short, appetizing description"
                className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-text-primary">
                Dietary indicators
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const active = form.dietaryTags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(tag.value)}
                      className={
                        active
                          ? "h-9 rounded-full bg-brand-primary-soft px-4 text-sm font-semibold text-brand-primary"
                          : "h-9 rounded-full border border-border-default px-4 text-sm text-text-secondary hover:border-text-secondary"
                      }
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <p className="text-sm font-medium text-text-primary">Photograph</p>
              <div className="mt-2">
                <ItemImageUpload
                  restaurantId={restaurantId}
                  menuId={menuId}
                  sectionId={sectionId}
                  item={item}
                  stagedFile={stagedFile}
                  onStagedFile={setStagedFile}
                  onUploaded={onSaved}
                />
              </div>
            </div>

            <OptionRowsEditor
              label="Variants"
              addLabel="Add variant"
              rows={form.variants}
              onChange={(variants) => setForm((f) => ({ ...f, variants }))}
            />
            <OptionRowsEditor
              label="Add-ons"
              addLabel="Add add-on"
              rows={form.addons}
              onChange={(addons) => setForm((f) => ({ ...f, addons }))}
            />

            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isAvailable: e.target.checked }))
                }
                className="h-4 w-4 accent-brand-primary"
              />
              Available for ordering
            </label>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-11 rounded-lg border border-border-default px-5 text-sm font-medium text-text-primary hover:border-text-secondary"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-xl bg-brand-primary px-6 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
              >
                {saving ? "Saving…" : item ? "Save item" : "Add item"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
