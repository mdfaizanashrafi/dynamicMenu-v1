import { formatPrice } from "../menus/format-price";
import type { CustomerMenuItem } from "./customer-menu.types";
import { DietaryTagBadge } from "./dietary-tag-badge";

interface Props {
  item: CustomerMenuItem;
  onSelect: () => void;
}

/** Food card for the customer menu (DESIGN.md §14). */
export function CustomerItemCard({ item, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!item.isAvailable}
      className="flex w-full gap-3 p-3 text-left transition-transform active:scale-[0.99] disabled:opacity-60"
      style={{
        background: "var(--tm-surface)",
        borderRadius: "var(--tm-card-radius)",
      }}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-2xl"
          style={{ background: "var(--tm-bg)" }}
        >
          🍽
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold">{item.name}</h3>
          <span className="shrink-0 font-bold" style={{ color: "var(--tm-primary)" }}>
            {formatPrice(item.price)}
          </span>
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-sm opacity-70">{item.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
          {item.dietaryTags.map((tag) => (
            <DietaryTagBadge key={tag} tag={tag} />
          ))}
          {!item.isAvailable && (
            <span className="rounded px-1.5 py-0.5 text-xs font-medium opacity-60 line-through">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
