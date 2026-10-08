import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { MenuDetail, MenuSummary } from "./menu.types";

/** Fetches the restaurant's menu list. */
export function useMenusList(restaurantId: string | undefined) {
  const { getToken } = useAuth();
  const [menus, setMenus] = useState<MenuSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<MenuSummary[]>(
        `/api/v1/restaurants/${restaurantId}/menus`,
        { token }
      );
      setMenus(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load menus.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { menus, loading, error, refresh };
}

/** Fetches a single menu's draft tree (and current revision info). */
export function useMenuDetail(
  restaurantId: string | undefined,
  menuId: string | undefined
) {
  const { getToken } = useAuth();
  const [menu, setMenu] = useState<MenuDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId || !menuId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<MenuDetail>(
        `/api/v1/restaurants/${restaurantId}/menus/${menuId}`,
        { token }
      );
      setMenu(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load menu.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, menuId, getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { menu, loading, error, refresh };
}
