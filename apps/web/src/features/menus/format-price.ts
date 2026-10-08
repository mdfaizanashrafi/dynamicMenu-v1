/** Neutral price formatting — currency symbols arrive with a future setting. */
export function formatPrice(value: string | number): string {
  if (typeof value === "string" && value.trim() === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
