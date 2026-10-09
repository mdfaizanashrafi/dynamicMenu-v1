/** Centered loading screen for the customer menu (DESIGN.md §23). */
export function CustomerMenuLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-warm px-6">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-brand-primary" />
        <p className="mt-3 text-sm text-text-secondary">Opening your table menu…</p>
      </div>
    </div>
  );
}
