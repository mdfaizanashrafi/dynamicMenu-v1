import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { RestaurantSummary } from "../restaurant/restaurant.types";
import { useRestaurantContext } from "../restaurant/restaurant-context";

/** Empty state: the user has no restaurant yet. */
export function CreateRestaurantForm() {
  const { getToken } = useAuth();
  const { refresh, selectRestaurant } = useRestaurantContext();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const restaurant = await apiFetch<RestaurantSummary>(
        "/api/v1/restaurants",
        { method: "POST", token, body: JSON.stringify({ name, slug }) }
      );
      await refresh();
      selectRestaurant(restaurant.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-md rounded-card border border-border-default bg-surface-primary p-6"
    >
      <h2 className="text-lg font-semibold text-text-primary">
        Create your restaurant
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        This becomes your workspace — menus, tables, orders and QR codes all
        live here.
      </p>

      <label className="mt-4 block text-sm font-medium text-text-primary">
        Restaurant name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
          placeholder="Tandoor House"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-text-primary">
        URL name
        <div className="mt-1 flex h-11 items-center rounded-lg border border-border-default px-3 focus-within:border-brand-primary">
          <span className="text-sm text-text-secondary">/menu/</span>
          <input
            required
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
            }
            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            className="w-full text-sm outline-none"
            placeholder="tandoor-house"
          />
        </div>
      </label>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 h-11 w-full rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create restaurant"}
      </button>
    </form>
  );
}
