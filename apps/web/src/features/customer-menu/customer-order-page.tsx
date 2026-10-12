import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { formatPrice } from "../menus/format-price";
import { CustomerMenuLoading } from "./customer-menu-loading";
import { CustomerMenuError } from "./customer-menu-error";

interface CustomerReview {
  id: string;
  rating: number;
  comment: string | null;
  googleMapsOpenedAt: string | null;
  createdAt: string;
}

interface CustomerOrderStatus {
  id: string;
  status: string;
  total: number;
  table: { label: string };
  restaurant: { name: string; googleMapsUrl: string | null };
  reviewEligible: boolean;
  review: CustomerReview | null;
  loyalty: { points: number } | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order received",
  CONFIRMED: "Confirmed by the restaurant",
  PREPARING: "Being prepared",
  READY: "Ready for pickup",
  SERVED: "Served",
  PAID: "Paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

/** /q/:token/order/:orderId — customer order tracking + post-payment review. */
export function CustomerOrderPage() {
  const { token, orderId } = useParams<{ token: string; orderId: string }>();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; data: CustomerOrderStatus }
  >({ kind: "loading" });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !orderId) return;
    try {
      const data = await apiFetch<CustomerOrderStatus>(
        `/api/v1/public/qr/${token}/orders/${orderId}`
      );
      setState({ kind: "ready", data });
    } catch (e: unknown) {
      setState({
        kind: "error",
        message:
          e instanceof Error && e.message
            ? e.message
            : "We could not load your order.",
      });
    }
  }, [token, orderId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !orderId) return;
    setBusy(true);
    setNotice(null);
    try {
      await apiFetch(`/api/v1/public/qr/${token}/orders/${orderId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      await load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setBusy(false);
    }
  };

  const openGoogleMaps = async () => {
    if (!token || !orderId) return;
    setBusy(true);
    setNotice(null);
    try {
      const { googleMapsUrl } = await apiFetch<{ googleMapsUrl: string | null }>(
        `/api/v1/public/qr/${token}/orders/${orderId}/review/google`,
        { method: "POST" }
      );
      if (googleMapsUrl) {
        window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
      }
      await load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Could not open Google Maps.");
    } finally {
      setBusy(false);
    }
  };

  if (state.kind === "loading") return <CustomerMenuLoading />;
  if (state.kind === "error") return <CustomerMenuError message={state.message} />;

  const { data } = state;

  // SEO: put the restaurant name in the tab title (Phase 17).
  document.title = `${data.restaurant.name} — Order — DynamicMenu`;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-warm px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-border-default bg-surface-primary p-6">
        <p className="text-sm text-text-secondary">{data.restaurant.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-text-primary">
          {data.table.label}
        </h1>
        <p className="mt-3 rounded-lg bg-surface-secondary p-3 text-sm font-medium text-text-primary">
          {STATUS_LABELS[data.status] ?? data.status} · {formatPrice(data.total)}
        </p>
        {data.loyalty && (
          <p className="mt-2 rounded-lg bg-brand-primary-soft p-3 text-sm font-semibold text-brand-primary">
            Loyalty Program: {data.loyalty.points} point
            {data.loyalty.points === 1 ? "" : "s"} — earned when orders are
            marked paid.
          </p>
        )}
        <p className="mt-2 text-xs text-text-secondary">
          Status updates automatically. This page refreshes every 5 seconds.
        </p>

        {data.reviewEligible && !data.review && (
          <form onSubmit={submitReview} className="mt-6 border-t border-border-default pt-5">
            <h2 className="text-lg font-semibold text-text-primary">
              How was your meal?
            </h2>
            <div className="mt-3 flex gap-1" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className={`text-2xl ${n <= rating ? "text-brand-primary" : "text-border-default"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              rows={3}
              className="mt-3 w-full rounded-lg border border-border-default p-3 text-sm outline-none focus:border-brand-primary"
            />
            {notice && <p className="mt-2 text-sm text-error">{notice}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-3 h-11 w-full rounded-xl bg-brand-primary text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Submit feedback"}
            </button>
          </form>
        )}

        {data.review && (
          <div className="mt-6 border-t border-border-default pt-5">
            <h2 className="text-lg font-semibold text-text-primary">
              Thank you for your feedback!
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              You rated this order {data.review.rating} star
              {data.review.rating === 1 ? "" : "s"}.
            </p>
            {data.restaurant.googleMapsUrl && (
              <button
                type="button"
                disabled={busy || data.review.googleMapsOpenedAt !== null}
                onClick={() => void openGoogleMaps()}
                className="mt-4 h-11 w-full rounded-xl border border-brand-primary text-sm font-semibold text-brand-primary hover:bg-brand-primary-soft disabled:opacity-60"
              >
                {data.review.googleMapsOpenedAt
                  ? "Google Maps review link opened"
                  : "Leave a review on Google Maps"}
              </button>
            )}
            <p className="mt-3 text-xs text-text-secondary">
              The Google link opens Google Maps in a new tab — we can confirm you
              were redirected, but not whether a review was posted there.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
