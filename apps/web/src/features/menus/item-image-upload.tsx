import { useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { MenuItemNode } from "./menu.types";

interface Props {
  restaurantId: string;
  menuId: string;
  sectionId: string;
  /** Present once the item exists in the draft tree. */
  item: MenuItemNode | null;
  /** Staged file for not-yet-created items; uploaded right after create. */
  stagedFile: File | null;
  onStagedFile: (file: File | null) => void;
  onUploaded: () => void;
}

const ACCEPTED = "image/jpeg,image/png,image/webp";

/** Menu item photograph upload (1:1 or 4:3 per DESIGN.md §24). */
export function ItemImageUpload({
  restaurantId,
  menuId,
  sectionId,
  item,
  stagedFile,
  onStagedFile,
  onUploaded,
}: Props) {
  const { getToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = stagedFile
    ? URL.createObjectURL(stagedFile)
    : item?.imageUrl ?? null;

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = await getToken();
      await apiFetch(
        `/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items/${item!.id}/image`,
        { method: "POST", token, body: formData }
      );
      onStagedFile(null);
      onUploaded();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!item) {
      onStagedFile(file);
      return;
    }
    void upload(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        aria-label="Item photograph"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {previewUrl ? (
        <div className="flex items-center gap-4">
          <img
            src={previewUrl}
            alt="Item photograph"
            className="h-24 w-24 rounded-xl border border-border-default object-cover"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-text-primary hover:border-text-secondary disabled:opacity-60"
          >
            {uploading ? "Uploading…" : stagedFile ? "Change photo" : "Replace photo"}
          </button>
          {stagedFile && (
            <span className="text-xs text-text-secondary">
              Will upload when you save
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default text-text-secondary hover:border-brand-primary hover:text-brand-primary"
        >
          <span className="text-2xl leading-none" aria-hidden>
            +
          </span>
          <span className="mt-1 px-1 text-center text-xs">
            {item ? "Add photo" : "Add photo (after save)"}
          </span>
        </button>
      )}
      <p className="mt-2 text-xs text-text-secondary">
        JPEG, PNG or WebP, up to 2 MB.
      </p>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
