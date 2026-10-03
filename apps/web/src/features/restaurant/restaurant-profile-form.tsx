import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import type { RestaurantDetail } from "./restaurant.types";
import { LogoUploader } from "./logo-uploader";

interface Props {
  detail: RestaurantDetail;
  canEdit: boolean;
  onSaved: () => void;
  onLogoUploaded: (logoUrl: string) => void;
}

const inputClass =
  "mt-1 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary disabled:opacity-70";
const textareaClass =
  "mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm outline-none focus:border-brand-primary disabled:opacity-70";

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-card border border-border-default bg-surface-primary p-6 scroll-mt-4">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {hint && <p className="mt-1 text-sm text-text-secondary">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Restaurant profile form (DESIGN.md §9 step 2). Optional fields never block. */
export function RestaurantProfileForm({
  detail,
  canEdit,
  onSaved,
  onLogoUploaded,
}: Props) {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name: detail.name,
    slug: detail.slug,
    cuisine: detail.cuisine ?? "",
    description: detail.description ?? "",
    phone: detail.phone ?? "",
    email: detail.email ?? "",
    addressLine1: detail.addressLine1 ?? "",
    addressLine2: detail.addressLine2 ?? "",
    city: detail.city ?? "",
    state: detail.state ?? "",
    postalCode: detail.postalCode ?? "",
    country: detail.country ?? "",
    primaryColor: detail.primaryColor ?? "#F97316",
    googleMapsUrl: detail.googleMapsUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const set = (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setNotice(null);
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/restaurants/${detail.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(form),
      });
      setNotice({ kind: "success", text: "Settings saved." });
      onSaved();
    } catch (err: unknown) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to save.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {!canEdit && (
        <p className="rounded-card border border-border-default bg-surface-primary p-4 text-sm text-text-secondary">
          You have read-only access to these settings (ADMIN role required to
          make changes).
        </p>
      )}

      <Section id="identity" title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-text-primary">
            Restaurant name
            <input
              required
              value={form.name}
              onChange={set("name")}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            URL name
            <input
              required
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                }))
              }
              disabled={!canEdit}
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              className={inputClass}
            />
          </label>
        </div>
      </Section>

      <Section
        id="logo"
        title="Logo"
        hint="Shown on your menu and dashboard header."
      >
        <LogoUploader
          restaurantId={detail.id}
          logoUrl={detail.logoUrl}
          canEdit={canEdit}
          onUploaded={onLogoUploaded}
        />
      </Section>

      <Section id="profile" title="Cuisine & description">
        <div className="grid gap-4">
          <label className="block text-sm font-medium text-text-primary">
            Cuisine
            <input
              value={form.cuisine}
              onChange={set("cuisine")}
              disabled={!canEdit}
              placeholder="North Indian"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={set("description")}
              disabled={!canEdit}
              placeholder="A short story about your restaurant"
              className={textareaClass}
            />
          </label>
        </div>
      </Section>

      <Section id="contact" title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-text-primary">
            Phone
            <input
              value={form.phone}
              onChange={set("phone")}
              disabled={!canEdit}
              placeholder="+91 99999 99999"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Email
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              disabled={!canEdit}
              placeholder="hello@yourrestaurant.com"
              className={inputClass}
            />
          </label>
        </div>
      </Section>

      <Section id="address" title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-text-primary sm:col-span-2">
            Address line 1
            <input
              value={form.addressLine1}
              onChange={set("addressLine1")}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary sm:col-span-2">
            Address line 2
            <input
              value={form.addressLine2}
              onChange={set("addressLine2")}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            City
            <input
              value={form.city}
              onChange={set("city")}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            State
            <input
              value={form.state}
              onChange={set("state")}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Postal code
            <input
              value={form.postalCode}
              onChange={set("postalCode")}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            Country
            <input
              value={form.country}
              onChange={set("country")}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
        </div>
      </Section>

      <Section id="branding" title="Branding">
        <label className="block text-sm font-medium text-text-primary">
          Primary color
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={set("primaryColor")}
              disabled={!canEdit}
              className="h-11 w-16 cursor-pointer rounded-lg border border-border-default bg-surface-primary disabled:opacity-70"
            />
            <span className="text-sm text-text-secondary">
              {form.primaryColor}
            </span>
          </div>
        </label>
      </Section>

      <Section
        id="maps"
        title="Google Maps review link"
        hint="Customers are redirected here after a paid order to leave a public review."
      >
        <label className="block text-sm font-medium text-text-primary">
          Review URL
          <input
            type="url"
            value={form.googleMapsUrl}
            onChange={set("googleMapsUrl")}
            disabled={!canEdit}
            placeholder="https://maps.app.goo.gl/…"
            className={inputClass}
          />
        </label>
      </Section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || !canEdit}
          className="h-11 rounded-xl bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {notice && (
          <p
            role="status"
            className={
              notice.kind === "success" ? "text-sm text-success" : "text-sm text-error"
            }
          >
            {notice.text}
          </p>
        )}
      </div>
    </form>
  );
}
