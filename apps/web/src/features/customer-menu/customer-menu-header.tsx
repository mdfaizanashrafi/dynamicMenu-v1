import type { CustomerMenuRestaurant, CustomerMenuTable } from "./customer-menu.types";
import type { ThemeConfig } from "../themes/theme.types";

interface Props {
  restaurant: CustomerMenuRestaurant;
  table: CustomerMenuTable;
  theme: ThemeConfig;
}

export function CustomerMenuHeader({ restaurant, table, theme }: Props) {
  const isBanner = theme.headerStyle === "banner";
  const showLogo = theme.headerStyle === "logo" || restaurant.logoUrl;

  return (
    <header
      className={`px-4 pt-5 ${isBanner ? "pb-5" : "pb-3"}`}
      style={
        isBanner ? { background: "var(--tm-secondary)" } : undefined
      }
    >
      <div className="mx-auto flex max-w-2xl items-center gap-4">
        {showLogo && restaurant.logoUrl && (
          <img
            src={restaurant.logoUrl}
            alt=""
            className="h-16 w-16 rounded-full border-2 object-cover shadow-sm"
            style={{ borderColor: "var(--tm-primary)" }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium opacity-70">{table.label}</p>
          <h1 className="text-2xl font-bold leading-tight">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="mt-1 line-clamp-2 text-sm opacity-80">
              {restaurant.description}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
