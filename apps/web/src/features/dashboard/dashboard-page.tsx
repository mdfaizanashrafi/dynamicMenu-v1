import { NavLink, Outlet } from "react-router-dom";
import { SignOutButton, UserButton } from "@clerk/clerk-react";
import {
  RestaurantProvider,
  useRestaurantContext,
} from "../restaurant/restaurant-context";
import { CreateRestaurantForm } from "./create-restaurant-form";
import { RestaurantSelector } from "./restaurant-selector";

const NAV_ITEMS: { label: string; to?: string }[] = [
  { label: "Overview", to: "/dashboard" },
  { label: "Menus" },
  { label: "Orders" },
  { label: "Offers" },
  { label: "Themes" },
  { label: "QR & Tables" },
  { label: "Customers" },
  { label: "Analytics" },
  { label: "Settings", to: "/dashboard/settings" },
];

export function DashboardPage() {
  return (
    <RestaurantProvider>
      <DashboardShell />
    </RestaurantProvider>
  );
}

function DashboardShell() {
  const { me, memberships, current, selectRestaurant, loading, error } =
    useRestaurantContext();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-secondary">
        <p className="text-text-secondary">Loading workspace…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-secondary">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  // Empty tenant: the owner must create a restaurant before anything else.
  if (memberships.length === 0) {
    return (
      <div className="flex min-h-dvh items-center bg-surface-secondary px-4 py-12">
        <CreateRestaurantForm />
      </div>
    );
  }

  const navLinkClass = (active: boolean) =>
    active
      ? "block rounded-lg bg-brand-primary-soft px-3 py-2 text-sm font-semibold text-brand-primary"
      : "block rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary";

  return (
    <div className="min-h-dvh bg-surface-secondary">
      <header className="border-b border-border-default bg-surface-primary">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-brand-primary">
              DynamicMenu
            </span>
            <RestaurantSelector
              memberships={memberships}
              current={current}
              onSelect={selectRestaurant}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-text-secondary sm:block">
              {me?.name ?? me?.email}
            </span>
            <UserButton />
            <SignOutButton>
              <button className="text-sm font-medium text-text-secondary hover:text-text-primary">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <nav className="hidden w-64 shrink-0 border-r border-border-default bg-surface-primary p-4 md:block">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <NavLink
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) => navLinkClass(isActive)}
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <span className={navLinkClass(false)}>
                    {item.label}
                    <span className="ml-2 text-xs text-text-secondary">
                      soon
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
