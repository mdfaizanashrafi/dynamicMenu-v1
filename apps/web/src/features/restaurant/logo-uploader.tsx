import { useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { RestaurantDetail } from "./restaurant.types";

interface Props {
  restaurantId: string;
  logoUrl: string | null;
  canEdit: boolean;
  onUploaded: (logoUrl: string) => void;
}

const ACCEPTED = "image/jpeg,image/png,image/webp";

/**
 * Image uploader with empty/uploading/preview/error states (DESIGN.md §20).
 * The API validates type and size again — client checks are UX only.
 */
export function LogoUploader({ restaurantId, logoUrl, canEdit, onUploaded }: Props) {
  const { getToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = await getToken();
      const updated = await apiFetch<RestaurantDetail>(
        `/api/v1/restaurants/${restaurantId}/logo`,
        { method: "POST", token, body: formData }
      );
      onUploaded(updated.logoUrl ?? "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        aria-label="Restaurant logo image"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {logoUrl ? (
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt="Restaurant logo"
            className="h-20 w-20 rounded-xl border border-border-default object-cover"
          />
          {canEdit && (
            <button
              type="button"
              onClick={pick}
              disabled={uploading}
              className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-text-primary hover:border-text-secondary disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Change logo"}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading || !canEdit}
          className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default text-text-secondary hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
        >
          <span className="text-2xl leading-none" aria-hidden>
            +
          </span>
          <span className="mt-1 text-xs">
            {uploading ? "Uploading…" : "Add logo"}
          </span>
        </button>
      )}

      <p className="mt-2 text-xs text-text-secondary">
        Square image (1:1), JPEG, PNG or WebP, up to 2 MB.
      </p>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
