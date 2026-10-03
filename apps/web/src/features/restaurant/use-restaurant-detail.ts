import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { RestaurantDetail } from "./restaurant.types";

/** Fetches (and refetches) the full profile for the selected restaurant. */
export function useRestaurantDetail(restaurantId: string | undefined) {
  const { getToken } = useAuth();
  const [detail, setDetail] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<RestaurantDetail>(
        `/api/v1/restaurants/${restaurantId}`,
        { token }
      );
      setDetail(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { detail, loading, error, refresh };
}
