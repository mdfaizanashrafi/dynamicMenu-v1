import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { QrImage, qrDownloadDataUrl } from "./qr-image";
import type { RestaurantTableDto } from "./table.types";

interface Props {
  table: RestaurantTableDto | null;
  restaurantName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Printable QR card (DESIGN.md §14): restaurant name, QR, "Scan to Explore
 * Our Menu", table label. PNG download at print resolution.
 */
export function QrViewDialog({ table, restaurantName, open, onOpenChange }: Props) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !table) return;
    let cancelled = false;
    setDownloadUrl(null);
    qrDownloadDataUrl(table.menuUrl)
      .then((url) => {
        if (!cancelled) setDownloadUrl(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, table]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-modal border border-border-default bg-surface-primary p-6 text-center shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-text-primary">
            {table?.label}
          </Dialog.Title>
          {table && (
            <div className="mt-4 rounded-2xl border border-border-default bg-surface-secondary p-6">
              <p className="text-base font-bold text-text-primary">
                {restaurantName}
              </p>
              <div className="mt-3 flex justify-center">
                <QrImage value={table.menuUrl} size={200} alt={`QR for ${table.label}`} />
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Scan to Explore Our Menu
              </p>
              <p className="text-xs text-text-secondary">{table.label}</p>
            </div>
          )}
          <div className="mt-5 flex justify-center gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-text-primary hover:border-text-secondary"
              >
                Close
              </button>
            </Dialog.Close>
            {table && (
              <a
                href={downloadUrl ?? "#"}
                download={`${restaurantName}-${table.label}-qr.png`.replace(/\s+/g, "-")}
                aria-disabled={!downloadUrl}
                className={
                  downloadUrl
                    ? "inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-hover"
                    : "inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white opacity-50"
                }
              >
                Download PNG
              </a>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
