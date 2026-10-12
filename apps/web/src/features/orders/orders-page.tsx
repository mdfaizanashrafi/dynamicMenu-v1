import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import { formatPrice } from "../menus/format-price";
import type { DashboardOrder, OrderStatus } from "./order.types";
import { ORDER_STATUSES, STATUS_LABELS, statusClass } from "./order-status";
import { OrderDetailDialog } from "./order-detail-dialog";

type Filter = OrderStatus | "ALL";

/** /dashboard/orders — restaurant order management (PHASES.md §12). */
export function OrdersPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;

  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DashboardOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const token = await getToken();
      const query = filter === "ALL" ? "" : `?status=${filter}`;
      const data = await apiFetch<DashboardOrder[]>(
        `/api/v1/restaurants/${restaurantId}/orders${query}`,
        { token }
      );
      setOrders(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filter, getToken]);

  // Initial load + polling for new orders (real-time updates come in Phase 17).
  useEffect(() => {
    setLoading(true);
    void refresh();
    const interval = setInterval(() => void refresh(), 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const transition = async (order: DashboardOrder, status: OrderStatus) => {
    if (!restaurantId) return;
    setBusy(true);
    setNotice(null);
    try {
      const token = await getToken();
      const updated = await apiFetch<DashboardOrder>(
        `/api/v1/restaurants/${restaurantId}/orders/${order.id}`,
        { method: "PATCH", body: JSON.stringify({ status }), token }
      );
      setNotice(`Order for ${updated.table.label} is now ${STATUS_LABELS[updated.status]}.`);
      setSelected(null);
      await refresh();
    } catch (e: unknown) {
      setNotice(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  const visible =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Orders</h1>
        <p className="mt-1 text-sm text-text-secondary">
          New orders appear here automatically. This view refreshes every 5 seconds.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={
            filter === "ALL"
              ? "h-9 rounded-full bg-brand-primary px-4 text-sm font-semibold text-white"
              : "h-9 rounded-full border border-border-default px-4 text-sm text-text-secondary hover:text-text-primary"
          }
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={
              filter === status
                ? "h-9 rounded-full bg-brand-primary px-4 text-sm font-semibold text-white"
                : "h-9 rounded-full border border-border-default px-4 text-sm text-text-secondary hover:text-text-primary"
            }
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {notice && <p className="text-sm text-text-secondary">{notice}</p>}
      {loading ? (
        <p className="text-sm text-text-secondary">Loading orders…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : visible.length === 0 ? (
        <div className="rounded-card border border-border-default bg-surface-primary p-10 text-center">
          <p className="font-medium text-text-primary">No orders</p>
          <p className="mt-1 text-sm text-text-secondary">
            Orders placed from scanned QR codes will show up here.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelected(order)}
                className="flex w-full items-center justify-between gap-3 rounded-card border border-border-default bg-surface-primary p-4 text-left hover:border-brand-primary"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    {order.table.label} · {formatPrice(order.total)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {order.customerName} · {order.items.length} item
                    {order.items.length === 1 ? "" : "s"} ·{" "}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order.status)}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <OrderDetailDialog
        order={selected}
        open={selected !== null}
        busy={busy}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onTransition={transition}
      />
    </div>
  );
}
