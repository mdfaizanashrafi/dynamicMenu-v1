import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";

interface UsageEntry {
  used: number;
  limit: number | null;
}

interface PlanInfo {
  key: string;
  name: string;
  priceMonthly: number | null;
  tagline: string;
  limits: { tables: number | null; menus: number | null; offers: number | null };
  features: { analytics: boolean; loyalty: boolean };
  current: boolean;
}

interface SubscriptionView {
  plan: string;
  status: string;
  usage: { tables: UsageEntry; menus: UsageEntry; offers: UsageEntry };
  plans: PlanInfo[];
}

/** /dashboard/billing — subscription & account management (PHASES.md §18). */
export function BillingPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const isOwner = current?.role === "OWNER";

  const [data, setData] = useState<SubscriptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const token = await getToken();
      const res = await apiFetch<SubscriptionView>(
        `/api/v1/restaurants/${restaurantId}/subscription`,
        { token }
      );
      setData(res);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load subscription.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectPlan = async (plan: string) => {
    if (!restaurantId) return;
    setBusy(true);
    setNotice(null);
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/restaurants/${restaurantId}/subscription/plan`, {
        method: "PUT",
        body: JSON.stringify({ plan }),
        token,
      });
      setNotice(`Plan changed to ${plan}.`);
      await refresh();
    } catch (e: unknown) {
      setNotice(e instanceof Error ? e.message : "Plan change failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  const usageRows: { label: string; entry: UsageEntry | undefined }[] = data
    ? [
        { label: "Tables", entry: data.usage.tables },
        { label: "Menus", entry: data.usage.menus },
        { label: "Offers", entry: data.usage.offers },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Billing & Plans</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your subscription plan and usage. Plan changes are instant and
          self-serve — no payment details are collected.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading subscription…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : data ? (
        <>
          <section className="rounded-card border border-border-default bg-surface-primary p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-text-secondary">Current plan</p>
                <p className="text-2xl font-bold text-text-primary">
                  {data.plans.find((p) => p.current)?.name ?? data.plan}
                </p>
                <p className="text-sm text-text-secondary">
                  {data.plans.find((p) => p.current)?.tagline}
                </p>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                {data.status}
              </span>
            </div>

            <h2 className="mt-5 text-sm font-semibold text-text-primary">Usage</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {usageRows.map(({ label, entry }) => {
                if (!entry) return null;
                const pct =
                  entry.limit === null ? 0 : Math.min(100, (entry.used / entry.limit) * 100);
                return (
                  <div key={label} className="rounded-card border border-border-default p-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-text-primary">{label}</span>
                      <span className="text-text-secondary">
                        {entry.used}
                        {entry.limit === null ? " / ∞" : ` / ${entry.limit}`}
                      </span>
                    </div>
                    {entry.limit !== null && (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
                        <div
                          className={
                            pct >= 100 ? "h-full bg-error" : "h-full bg-brand-primary"
                          }
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-primary">Plans</h2>
            {notice && <p className="mt-2 text-sm text-text-secondary">{notice}</p>}
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.plans.map((plan) => (
                <div
                  key={plan.key}
                  className={
                    plan.current
                      ? "rounded-card border-2 border-brand-primary bg-surface-primary p-4"
                      : "rounded-card border border-border-default bg-surface-primary p-4"
                  }
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text-primary">{plan.name}</p>
                    {plan.current && (
                      <span className="rounded-full bg-brand-primary-soft px-2 py-0.5 text-xs font-semibold text-brand-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {plan.priceMonthly === null
                      ? "Contact us"
                      : plan.priceMonthly === 0
                        ? "Free"
                        : `₹${plan.priceMonthly}/mo`}
                  </p>
                  <p className="text-sm text-text-secondary">{plan.tagline}</p>
                  <ul className="mt-3 space-y-1 text-sm text-text-secondary">
                    <li>
                      Tables: {plan.limits.tables ?? "Unlimited"}
                    </li>
                    <li>Menus: {plan.limits.menus ?? "Unlimited"}</li>
                    <li>Offers: {plan.limits.offers ?? "Unlimited"}</li>
                    <li>Analytics: {plan.features.analytics ? "Included" : "—"}</li>
                    <li>Loyalty Program: {plan.features.loyalty ? "Included" : "—"}</li>
                  </ul>
                  {!plan.current && isOwner && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void selectPlan(plan.key)}
                      className="mt-4 h-10 w-full rounded-xl border border-brand-primary text-sm font-semibold text-brand-primary hover:bg-brand-primary-soft disabled:opacity-60"
                    >
                      Switch to {plan.name}
                    </button>
                  )}
                  {!plan.current && !isOwner && (
                    <p className="mt-4 text-xs text-text-secondary">
                      Only the owner can change plans.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
