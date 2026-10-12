import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import { formatPrice } from "../menus/format-price";
import type { CustomerDetail, CustomerSummary } from "./customer.types";
import { CustomerDetailDialog } from "./customer-detail-dialog";

/** /dashboard/customers — customer list, search, and profiles (PHASES.md §14). */
export function CustomersPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const isManagerPlus =
    current?.role === "OWNER" ||
    current?.role === "ADMIN" ||
    current?.role === "MANAGER";

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const refresh = useCallback(
    async (q: string) => {
      if (!restaurantId) return;
      try {
        const token = await getToken();
        const suffix = q ? `?q=${encodeURIComponent(q)}` : "";
        const data = await apiFetch<CustomerSummary[]>(
          `/api/v1/restaurants/${restaurantId}/customers${suffix}`,
          { token }
        );
        setCustomers(data);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load customers.");
      } finally {
        setLoading(false);
      }
    },
    [restaurantId, getToken]
  );

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => void refresh(query), 200);
    return () => clearTimeout(t);
  }, [query, refresh]);

  const openDetail = async (customer: CustomerSummary) => {
    if (!isManagerPlus) return;
    if (!restaurantId) return;
    setDetailError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<CustomerDetail>(
        `/api/v1/restaurants/${restaurantId}/customers/${customer.id}`,
        { token }
      );
      setDetail(data);
    } catch (e: unknown) {
      setDetailError(e instanceof Error ? e.message : "Failed to load customer.");
    }
  };

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Customers</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Profiles are created automatically from orders.{" "}
          {isManagerPlus
            ? "Select a customer to see order history and insights."
            : "Ask a manager for full customer details."}
        </p>
      </section>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, phone, or email…"
        className="h-11 w-full max-w-md rounded-lg border border-border-default bg-surface-primary px-3 text-sm outline-none focus:border-brand-primary"
      />

      {detailError && <p className="text-sm text-error">{detailError}</p>}
      {loading ? (
        <p className="text-sm text-text-secondary">Loading customers…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : customers.length === 0 ? (
        <div className="rounded-card border border-border-default bg-surface-primary p-10 text-center">
          <p className="font-medium text-text-primary">No customers yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Customer profiles appear here after their first order.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {customers.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => void openDetail(customer)}
                disabled={!isManagerPlus}
                className="flex w-full items-center justify-between gap-3 rounded-card border border-border-default bg-surface-primary p-4 text-left hover:border-brand-primary disabled:cursor-default disabled:hover:border-border-default"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-primary">
                    {customer.name}
                  </p>
                  <p className="truncate text-sm text-text-secondary">
                    {customer.phone}
                    {customer.email ? ` · ${customer.email}` : ""}
                  </p>
                  {customer.lastOrderAt && (
                    <p className="text-xs text-text-secondary">
                      Last order {new Date(customer.lastOrderAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-text-primary">
                    {formatPrice(customer.totalSpent)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <CustomerDetailDialog
        customer={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </div>
  );
}
