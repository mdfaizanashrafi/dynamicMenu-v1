import { useAuth } from "@clerk/clerk-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../../services/api";
import type { Membership, Me } from "./restaurant.types";

export interface RestaurantContextValue {
  me: Me | null;
  memberships: Membership[];
  current: Membership | null;
  selectRestaurant: (restaurantId: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "dynamicmenu.currentRestaurant";

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      const [meData, membershipsData] = await Promise.all([
        apiFetch<Me>("/api/v1/me", { token }),
        apiFetch<Membership[]>("/api/v1/restaurants", { token }),
      ]);
      setMe(meData);
      setMemberships(membershipsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectRestaurant = useCallback((restaurantId: string) => {
    setCurrentId(restaurantId);
    localStorage.setItem(STORAGE_KEY, restaurantId);
  }, []);

  const value = useMemo<RestaurantContextValue>(() => {
    const current =
      memberships.find((m) => m.restaurant.id === currentId) ?? null;
    return {
      me,
      memberships,
      current,
      selectRestaurant,
      refresh,
      loading,
      error,
    };
  }, [me, memberships, currentId, selectRestaurant, refresh, loading, error]);

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurantContext(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error("useRestaurantContext must be used inside RestaurantProvider");
  }
  return ctx;
}
