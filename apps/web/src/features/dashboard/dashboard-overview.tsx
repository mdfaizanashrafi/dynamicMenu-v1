import { useRestaurantContext } from "../restaurant/restaurant-context";
import { useRestaurantDetail } from "../restaurant/use-restaurant-detail";
import { OnboardingCard } from "../restaurant/onboarding-card";

export function DashboardOverviewPage() {
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const { detail, loading, error } = useRestaurantDetail(restaurantId);

  if (!current) {
    return (
      <p className="text-text-secondary">Select a restaurant to continue.</p>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">
          {current.restaurant.name}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your role: {current.role} · Status: {current.restaurant.status}
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading setup progress…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : detail ? (
        <OnboardingCard onboarding={detail.onboarding} />
      ) : null}

      <p className="rounded-card border border-border-default bg-surface-primary p-4 text-sm text-text-secondary">
        Workspace ready. Menu, orders, tables and analytics arrive in upcoming
        phases.
      </p>
    </div>
  );
}
