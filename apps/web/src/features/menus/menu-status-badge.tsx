interface Props {
  status: "DRAFT" | "PUBLISHED";
}

export function MenuStatusBadge({ status }: Props) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={
        published
          ? "inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success"
          : "inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning"
      }
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
