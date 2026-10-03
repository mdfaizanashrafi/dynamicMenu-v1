import type { Membership } from "../restaurant/restaurant.types";

interface Props {
  memberships: Membership[];
  current: Membership | null;
  onSelect: (restaurantId: string) => void;
}

/** Restaurant switcher shown when the user belongs to multiple tenants. */
export function RestaurantSelector({ memberships, current, onSelect }: Props) {
  if (memberships.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-text-secondary">
      <span className="sr-only">Current restaurant</span>
      <select
        value={current?.restaurant.id ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="h-9 rounded-lg border border-border-default bg-surface-primary px-2 text-sm font-medium text-text-primary"
      >
        {current === null && <option value="">Select…</option>}
        {memberships.map((m) => (
          <option key={m.restaurant.id} value={m.restaurant.id}>
            {m.restaurant.name} ({m.role})
          </option>
        ))}
      </select>
    </label>
  );
}
