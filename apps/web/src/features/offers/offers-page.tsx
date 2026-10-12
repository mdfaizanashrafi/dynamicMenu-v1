import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  discountType: "PERCENT" | "FLAT" | null;
  discountValue: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  position: number;
}

interface FormState {
  id: string | null;
  title: string;
  badgeText: string;
  description: string;
  discountType: "" | "PERCENT" | "FLAT";
  discountValue: string;
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  badgeText: "",
  description: "",
  discountType: "",
  discountValue: "",
  startsAt: "",
  endsAt: "",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function discountLabel(o: Offer): string | null {
  if (!o.discountType || o.discountValue == null) return null;
  return o.discountType === "PERCENT"
    ? `${o.discountValue}% off orders`
    : `Flat ${o.discountValue} off orders`;
}

function scheduleLabel(o: Offer): string {
  const parts: string[] = [];
  if (o.startsAt) parts.push(`from ${new Date(o.startsAt).toLocaleDateString()}`);
  if (o.endsAt) parts.push(`until ${new Date(o.endsAt).toLocaleDateString()}`);
  return parts.length > 0 ? parts.join(" ") : "always on";
}

/** /dashboard/offers — offer & campaign management (PHASES.md §17, MANAGER+). */
export function OffersPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const token = await getToken();
      const data = await apiFetch<Offer[]>(
        `/api/v1/restaurants/${restaurantId}/offers`,
        { token }
      );
      setOffers(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load offers.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const editOffer = (offer: Offer) => {
    setForm({
      id: offer.id,
      title: offer.title,
      badgeText: offer.badgeText ?? "",
      description: offer.description ?? "",
      discountType: offer.discountType ?? "",
      discountValue: offer.discountValue?.toString() ?? "",
      startsAt: toLocalInput(offer.startsAt),
      endsAt: toLocalInput(offer.endsAt),
    });
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setBusy(true);
    setNotice(null);
    const body = {
      title: form.title.trim(),
      badgeText: form.badgeText.trim() || undefined,
      description: form.description.trim() || undefined,
      discountType: form.discountType || null,
      discountValue: form.discountType ? Number(form.discountValue) : undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
    try {
      const token = await getToken();
      if (form.id) {
        await apiFetch(`/api/v1/restaurants/${restaurantId}/offers/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          token,
        });
        setNotice("Offer updated.");
      } else {
        await apiFetch(`/api/v1/restaurants/${restaurantId}/offers`, {
          method: "POST",
          body: JSON.stringify(body),
          token,
        });
        setNotice("Offer created.");
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (offer: Offer) => {
    if (!restaurantId) return;
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/restaurants/${restaurantId}/offers/${offer.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !offer.isActive }),
        token,
      });
      await refresh();
    } catch (e: unknown) {
      setNotice(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const remove = async () => {
    if (!restaurantId || !deleting) return;
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/restaurants/${restaurantId}/offers/${deleting.id}`, {
        method: "DELETE",
        token,
      });
      setDeleting(null);
      await refresh();
    } catch (e: unknown) {
      setNotice(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Offers</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Promotional campaigns shown on the customer menu. Discounts apply
          automatically to new orders while a campaign is live.
        </p>
      </section>

      <form
        onSubmit={submit}
        className="rounded-card border border-border-default bg-surface-primary p-4"
      >
        <h2 className="text-sm font-semibold text-text-primary">
          {form.id ? "Edit offer" : "New offer"}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-medium text-text-primary">
            Title
            <input
              required
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Happy Hour"
              className="mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Badge
            <input
              value={form.badgeText}
              onChange={(e) => patch({ badgeText: e.target.value })}
              placeholder="20% OFF"
              className="mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Discount
            <select
              value={form.discountType}
              onChange={(e) =>
                patch({ discountType: e.target.value as FormState["discountType"] })
              }
              className="mt-1 h-11 w-full rounded-lg border border-border-default bg-transparent px-3 text-sm outline-none focus:border-brand-primary"
            >
              <option value="">No discount (banner only)</option>
              <option value="PERCENT">Percent off order</option>
              <option value="FLAT">Flat amount off order</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Value
            <input
              type="number"
              min={1}
              max={form.discountType === "PERCENT" ? 100 : undefined}
              disabled={!form.discountType}
              required={!!form.discountType}
              value={form.discountValue}
              onChange={(e) => patch({ discountValue: e.target.value })}
              className="mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary disabled:opacity-50"
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Starts at
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => patch({ startsAt: e.target.value })}
              className="mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Ends at
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => patch({ endsAt: e.target.value })}
              className="mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="block text-sm font-medium text-text-primary sm:col-span-2">
            Description
            <input
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Weekdays 4–7 PM"
              className="mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {busy ? "Saving…" : form.id ? "Save changes" : "Create offer"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="h-11 rounded-xl border border-border-default px-4 text-sm text-text-secondary"
            >
              Cancel edit
            </button>
          )}
        </div>
        {notice && <p className="mt-2 text-sm text-text-secondary">{notice}</p>}
      </form>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading offers…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : offers.length === 0 ? (
        <div className="rounded-card border border-border-default bg-surface-primary p-10 text-center">
          <p className="font-medium text-text-primary">No offers yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Create a campaign above — it will appear on your customer menu.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex items-start justify-between gap-3 rounded-card border border-border-default bg-surface-primary p-4"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-text-primary">
                  {offer.title}
                  {offer.badgeText && (
                    <span className="rounded-full bg-brand-primary-soft px-2 py-0.5 text-xs font-semibold text-brand-primary">
                      {offer.badgeText}
                    </span>
                  )}
                  <span
                    className={
                      offer.isActive
                        ? "rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success"
                        : "rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary"
                    }
                  >
                    {offer.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {discountLabel(offer) ?? "Banner only"} · {scheduleLabel(offer)}
                </p>
                {offer.description && (
                  <p className="mt-0.5 text-sm text-text-secondary">{offer.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => editOffer(offer)}
                  className="h-9 rounded-lg border border-border-default px-3 text-sm text-text-primary hover:border-text-secondary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(offer)}
                  className="h-9 rounded-lg border border-border-default px-3 text-sm text-text-primary hover:border-text-secondary"
                >
                  {offer.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(offer)}
                  className="h-9 rounded-lg border border-border-default px-3 text-sm text-error hover:border-error"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.title}”?`}
        description="The campaign will stop showing on the customer menu. Past orders keep their applied discount."
        confirmLabel="Delete offer"
        destructive
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
