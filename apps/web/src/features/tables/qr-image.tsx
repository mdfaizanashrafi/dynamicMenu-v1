import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  value: string;
  /** Rendered size in px. */
  size?: number;
  alt?: string;
}

/** QR image generated client-side from a real table URL (DESIGN.md §14). */
export function QrImage({ value, size = 96, alt }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: 256, margin: 2 })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (error) {
    return (
      <span className="flex items-center justify-center rounded-lg bg-surface-secondary text-xs text-text-secondary">
        QR error
      </span>
    );
  }
  if (!dataUrl) {
    return (
      <span
        aria-hidden
        className="block animate-pulse rounded-lg bg-surface-secondary"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <img
      src={dataUrl}
      alt={alt ?? "QR code"}
      width={size}
      height={size}
      className="rounded-lg border border-border-default"
    />
  );
}

/** Generate a print/download-ready PNG data URL for a table QR. */
export async function qrDownloadDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { width: 1024, margin: 3 });
}
