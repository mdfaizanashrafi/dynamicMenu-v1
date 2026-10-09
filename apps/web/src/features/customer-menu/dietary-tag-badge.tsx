const LABELS: Record<string, string> = {
  VEG: "Veg",
  NON_VEG: "Non-Veg",
  VEGAN: "Vegan",
  SPICY: "Spicy",
  GLUTEN_FREE: "Gluten Free",
};

interface Props {
  tag: string;
}

export function DietaryTagBadge({ tag }: Props) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        background: "var(--tm-primary)",
        color: "var(--tm-bg)",
      }}
    >
      {LABELS[tag] ?? tag}
    </span>
  );
}
