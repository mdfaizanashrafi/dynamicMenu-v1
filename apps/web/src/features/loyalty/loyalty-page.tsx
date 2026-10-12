import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";

interface LoyaltyAccount {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  points: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
}

/** /dashboard/loyalty — Loyalty Program management (PHASES.md §16). */
export function LoyaltyPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const isManagerPlus =
    current?.role === "OWNER" ||
    current?.role === "ADMIN" ||
    current?.role === "MANAGER";

  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState("1");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(
    async (q: string) => {
      if (!restaurantId || !isManagerPlus) return;
      try {
        const token = await getToken();
        const suffix = q ? `?q=${encodeURIComponent(q)}` : "";
        const data = await apiFetch<LoyaltyAccount[]>(
          `/api/v1/restaurants/${restaurantId}/loyalty/accounts${suffix}`,
          { token }
        );
        setAccounts(data);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load accounts.");
      } finally {
        setLoading(false);
      }
    },
    [restaurantId, isManagerPlus, getToken]
  );

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => void refresh(query), 200);
    return () => clearTimeout(t);
  }, [query, refresh]);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setBusy(true);
    setNotice(null);
    try {
      const token = await getToken();
      const updated = await apiFetch<LoyaltyAccount>(
        `/api/v1/restaurants/${restaurantId}/loyalty/redeem`,
        {
          method: "POST",
          body: JSON.stringify({
            phone: phone.trim(),
            points: Number(points),
            reason: reason.trim() || undefined,
          }),
          token,
        }
      );
      setNotice(
        `Redeemed ${points} point${points === "1" ? "" : "s"} for ${updated.name} — balance is now ${updated.points}.`
      );
      setPhone("");
      setReason("");
      await refresh(query);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Redemption failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Loyalty Program</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Customers earn 1 point per 100 spent when an order is marked paid.
          Redeem points at the counter below.
        </p>
      </section>

      <form
        onSubmit={redeem}
        className="flex flex-wrap items-end gap-3 rounded-card border border-border-default bg-surface-primary p-4"
      >
        <label className="block text-sm font-medium text-text-primary">
          Customer phone
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555"
            className="mt-1 h-11 w-44 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Points
          <input
            required
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="mt-1 h-11 w-24 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Note (optional)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Free dessert"
            className="mt-1 h-11 w-56 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
        >
          {busy ? "Redeeming…" : "Redeem points"}
        </button>
        {notice && <p className="w-full text-sm text-text-secondary">{notice}</p>}
      </form>

      {isManagerPlus && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts by name or phone…"
            className="h-11 w-full max-w-md rounded-lg border border-border-default bg-surface-primary px-3 text-sm outline-none focus:border-brand-primary"
          />
          {loading ? (
            <p className="text-sm text-text-secondary">Loading accounts…</p>
          ) : error ? (
            <p className="text-sm text-error">{error}</p>
          ) : accounts.length === 0 ? (
            <div className="rounded-card border border-border-default bg-surface-primary p-10 text-center">
              <p className="font-medium text-text-primary">No loyalty accounts yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Accounts appear when a paid order earns the customer&apos;s first
                point.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-card border border-border-default bg-surface-primary p-4"
                >
                  <div>
                    <p className="font-semibold text-text-primary">{account.name}</p>
                    <p className="text-sm text-text-secondary">{account.phone}</p>
                    <p className="text-xs text-text-secondary">
                      Earned {account.lifetimeEarned} · Redeemed{" "}
                      {account.lifetimeRedeemed}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-brand-primary">
                    {account.points}
                    <span className="ml-1 text-xs font-medium text-text-secondary">
                      pts
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
