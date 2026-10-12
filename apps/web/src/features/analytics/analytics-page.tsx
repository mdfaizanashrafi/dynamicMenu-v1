import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import { formatPrice } from "../menus/format-price";
import { STATUS_LABELS } from "../orders/order-status";

interface AnalyticsPayload {
  rangeDays: number;
  overview: {
    totalOrders: number;
    revenue: number;
    averageOrderValue: number;
    totalCustomers: number;
    repeatCustomers: number;
    reviewCount: number;
    averageRating: number | null;
  };
  daily: { date: string; orders: number; revenue: number }[];
  popularItems: { name: string; quantity: number; revenue: number }[];
  topCustomers: { id: string; name: string; phone: string; orders: number; spent: number }[];
  ordersByTable: { label: string; orders: number }[];
  orderStatusBreakdown: { status: string; count: number }[];
  byBranch: { id: string; name: string; orders: number; revenue: number }[];
}

const RANGES = [7, 14, 30] as const;

/** /dashboard/analytics — restaurant analytics (PHASES.md §15, MANAGER+). */
export function AnalyticsPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;

  const [days, setDays] = useState<number>(14);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (range: number) => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const token = await getToken();
        const res = await apiFetch<AnalyticsPayload>(
          `/api/v1/restaurants/${restaurantId}/analytics?days=${range}`,
          { token }
        );
        setData(res);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    },
    [restaurantId, getToken]
  );

  useEffect(() => {
    void load(days);
  }, [days, load]);

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  const maxOrders = Math.max(1, ...(data?.daily.map((d) => d.orders) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <section>
          <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Live metrics computed from your orders. Managers and owners only.
          </p>
        </section>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={
                days === r
                  ? "h-9 rounded-full bg-brand-primary px-4 text-sm font-semibold text-white"
                  : "h-9 rounded-full border border-border-default px-4 text-sm text-text-secondary hover:text-text-primary"
              }
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm text-text-secondary">Loading analytics…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total orders (all time)" value={String(data.overview.totalOrders)} />
            <StatCard label="Revenue (paid)" value={formatPrice(data.overview.revenue)} />
            <StatCard label="Average order value" value={formatPrice(data.overview.averageOrderValue)} />
            <StatCard
              label="Customers"
              value={`${data.overview.totalCustomers} (${data.overview.repeatCustomers} repeat)`}
            />
            <StatCard
              label="Reviews"
              value={
                data.overview.averageRating !== null
                  ? `${data.overview.averageRating}★ from ${data.overview.reviewCount}`
                  : "None yet"
              }
            />
          </div>

          <section className="rounded-card border border-border-default bg-surface-primary p-5">
            <h2 className="text-sm font-semibold text-text-primary">
              Orders per day (last {data.rangeDays} days)
            </h2>
            <div className="mt-4 flex h-32 items-end gap-1">
              {data.daily.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.orders} orders, ${formatPrice(d.revenue)}`}
                  className="flex-1 rounded-t bg-brand-primary/80 hover:bg-brand-primary"
                  style={{ height: `${Math.max(4, (d.orders / maxOrders) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-text-secondary">
              <span>{data.daily[0]?.date}</span>
              <span>{data.daily[data.daily.length - 1]?.date}</span>
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-2">
            <ListCard
              title="Popular items"
              rows={data.popularItems.map((i) => ({
                label: i.name,
                detail: `${i.quantity} sold · ${formatPrice(i.revenue)}`,
              }))}
              empty="No items sold in this period."
            />
            <ListCard
              title="Top customers"
              rows={data.topCustomers.map((c) => ({
                label: c.name,
                detail: `${c.orders} orders · ${formatPrice(c.spent)}`,
              }))}
              empty="No customer activity yet."
            />
            <ListCard
              title="Orders by table"
              rows={data.ordersByTable.map((t) => ({
                label: t.label,
                detail: `${t.orders} orders`,
              }))}
              empty="No orders in this period."
            />
            <ListCard
              title="Order status breakdown"
              rows={data.orderStatusBreakdown.map((s) => ({
                label: STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ?? s.status,
                detail: `${s.count} orders`,
              }))}
              empty="No orders in this period."
            />
            {data.byBranch.length > 0 && (
              <ListCard
                title="By branch (organization)"
                rows={data.byBranch.map((b) => ({
                  label: b.name,
                  detail: `${b.orders} orders · ${formatPrice(b.revenue)}`,
                }))}
                empty="No branch activity."
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border-default bg-surface-primary p-4">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

function ListCard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; detail: string }[];
  empty: string;
}) {
  return (
    <section className="rounded-card border border-border-default bg-surface-primary p-5">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border-default">
          {rows.map((row, i) => (
            <li key={`${row.label}-${i}`} className="flex items-center justify-between gap-3 py-2">
              <span className="truncate text-sm font-medium text-text-primary">
                {row.label}
              </span>
              <span className="shrink-0 text-sm text-text-secondary">{row.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
