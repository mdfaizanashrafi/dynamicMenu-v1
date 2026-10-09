/** Empty state when the restaurant has no published menu yet (DESIGN.md §23). */
export function CustomerEmptyMenu() {
  return (
    <div
      className="rounded-card p-8 text-center"
      style={{
        background: "var(--tm-surface)",
        borderRadius: "var(--tm-card-radius)",
      }}
    >
      <p className="text-lg font-semibold">Menu coming soon</p>
      <p className="mt-2 text-sm opacity-70">
        This restaurant is still setting up its digital menu. Please check back
        shortly.
      </p>
    </div>
  );
}
