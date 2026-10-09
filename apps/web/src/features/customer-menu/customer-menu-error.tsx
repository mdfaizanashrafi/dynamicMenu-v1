interface Props {
  message: string;
}

/** Helpful invalid-QR / error screen for customer scans (DESIGN.md §23). */
export function CustomerMenuError({ message }: Props) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-warm px-6">
      <div className="max-w-sm rounded-card border border-border-default bg-surface-primary p-6 text-center">
        <h1 className="text-lg font-semibold text-text-primary">
          This QR code is unavailable
        </h1>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <p className="mt-4 text-xs text-text-secondary">
          Please ask restaurant staff for a new QR code.
        </p>
      </div>
    </div>
  );
}
