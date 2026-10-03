import { useRestaurantContext } from "./restaurant-context";
import { useRestaurantDetail } from "./use-restaurant-detail";
import { RestaurantProfileForm } from "./restaurant-profile-form";

/** /dashboard/settings — profile, branding and review-link configuration. */
export function RestaurantSettingsPage() {
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const { detail, loading, error, refresh } = useRestaurantDetail(restaurantId);

  if (!current) {
    return (
      <p className="text-text-secondary">Select a restaurant to continue.</p>
    );
  }

  // Restaurant settings are ADMIN+ (ARCHITECTURE.md §26 permission matrix).
  const canEdit = current.role === "OWNER" || current.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {current.restaurant.name} · optional details can be completed any
          time
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading settings…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : detail ? (
        <RestaurantProfileForm
          key={detail.id}
          detail={detail}
          canEdit={canEdit}
          onSaved={() => void refresh()}
          onLogoUploaded={() => void refresh()}
        />
      ) : null}
    </div>
  );
}
