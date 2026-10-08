import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import type {
  ThemeConfig,
  ThemePreviewData,
  ThemeState,
} from "./theme.types";
import { ThemePreview } from "./theme-preview";

const COLOR_FIELDS = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
] as const;

const FONT_OPTIONS = [
  { value: "sans", label: "Modern sans" },
  { value: "serif", label: "Classic serif" },
  { value: "rounded", label: "Friendly rounded" },
] as const;

const CARD_OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "outlined", label: "Outlined" },
  { value: "elevated", label: "Elevated" },
  { value: "soft", label: "Soft" },
] as const;

const BUTTON_OPTIONS = [
  { value: "pill", label: "Pill" },
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
] as const;

const BG_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "pattern", label: "Pattern" },
] as const;

const HEADER_OPTIONS = [
  { value: "minimal", label: "Minimal" },
  { value: "logo", label: "With logo" },
  { value: "banner", label: "Banner" },
] as const;

const selectClass =
  "mt-1 h-11 w-full rounded-lg border border-border-default bg-surface-primary px-3 text-sm outline-none focus:border-brand-primary";

/** /dashboard/themes — theme gallery, editor and live preview. */
export function ThemesPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;

  const [state, setState] = useState<ThemeState | null>(null);
  const [draft, setDraft] = useState<ThemeConfig | null>(null);
  const [previewData, setPreviewData] = useState<ThemePreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [themeState, preview] = await Promise.all([
          apiFetch<ThemeState>(`/api/v1/restaurants/${restaurantId}/theme`, {
            token,
          }),
          apiFetch<ThemePreviewData>(
            `/api/v1/restaurants/${restaurantId}/theme/preview`,
            { token }
          ),
        ]);
        if (!cancelled) {
          setState(themeState);
          setDraft(themeState.draft);
          setPreviewData(preview);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setNotice({
            kind: "error",
            text: e instanceof Error ? e.message : "Failed to load theme.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, getToken]);

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  const applyPreset = (key: string) => {
    const preset = state?.presets.find((p) => p.key === key);
    if (preset) setDraft(structuredClone(preset.config));
  };

  const patchDraft = (patch: Partial<ThemeConfig>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const save = async () => {
    if (!restaurantId || !draft) return;
    setSaving(true);
    setNotice(null);
    try {
      const token = await getToken();
      const updated = await apiFetch<ThemeState>(
        `/api/v1/restaurants/${restaurantId}/theme`,
        { method: "PUT", token, body: JSON.stringify(draft) }
      );
      setState(updated);
      setNotice({ kind: "success", text: "Draft saved." });
    } catch (e: unknown) {
      setNotice({
        kind: "error",
        text: e instanceof Error ? e.message : "Failed to save draft.",
      });
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!restaurantId) return;
    setPublishing(true);
    setNotice(null);
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/restaurants/${restaurantId}/theme/publish`, {
        method: "POST",
        token,
      });
      const updated = await apiFetch<ThemeState>(
        `/api/v1/restaurants/${restaurantId}/theme`,
        { token }
      );
      setState(updated);
      setNotice({ kind: "success", text: "Theme published." });
    } catch (e: unknown) {
      setNotice({
        kind: "error",
        text: e instanceof Error ? e.message : "Failed to publish.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const uploadCover = async (file: File | undefined) => {
    if (!restaurantId || !file || !draft) return;
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = await getToken();
      const { url } = await apiFetch<{ url: string }>(
        `/api/v1/restaurants/${restaurantId}/theme/image`,
        { method: "POST", token, body: formData }
      );
      patchDraft({ coverImageUrl: url });
    } catch (e: unknown) {
      setNotice({
        kind: "error",
        text: e instanceof Error ? e.message : "Upload failed.",
      });
    }
  };

  const dirty =
    state && draft ? JSON.stringify(state.draft) !== JSON.stringify(draft) : false;
  const publishedMatches =
    state?.published && draft
      ? JSON.stringify(state.published) === JSON.stringify(draft)
      : false;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Themes</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Style your customer menu. Themes change presentation only — your
            menu content is never touched.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state?.publishedAt && (
            <span className="text-xs text-text-secondary">
              Published {new Date(state.publishedAt).toLocaleString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !dirty}
            className="h-11 rounded-xl border border-border-default px-5 text-sm font-medium text-text-primary hover:border-text-secondary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={publishing || (!dirty && publishedMatches)}
            className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {publishing ? "Publishing…" : "Publish theme"}
          </button>
        </div>
      </section>

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
      {loading && <p className="text-sm text-text-secondary">Loading theme…</p>}

      {!loading && state && draft && previewData && (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-card border border-border-default bg-surface-primary p-5">
              <h2 className="text-lg font-semibold text-text-primary">
                Choose a theme
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {state.presets.map((preset) => {
                  const active = draft.preset === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyPreset(preset.key)}
                      className={
                        active
                          ? "rounded-xl border-2 border-brand-primary p-4 text-left"
                          : "rounded-xl border border-border-default p-4 text-left hover:border-text-secondary"
                      }
                    >
                      <div className="flex gap-1.5">
                        {Object.values(preset.config.colors).map((color) => (
                          <span
                            key={color}
                            className="h-4 w-4 rounded-full border border-black/10"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-text-primary">
                        {preset.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-card border border-border-default bg-surface-primary p-5">
              <h2 className="text-lg font-semibold text-text-primary">
                Customize
              </h2>

              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-text-primary">
                  Colors
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-5">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <label
                      key={key}
                      className="block text-xs font-medium text-text-secondary"
                    >
                      {label}
                      <input
                        type="color"
                        value={draft.colors[key]}
                        onChange={(e) =>
                          patchDraft({
                            colors: { ...draft.colors, [key]: e.target.value },
                          })
                        }
                        className="mt-1 h-11 w-full cursor-pointer rounded-lg border border-border-default bg-surface-primary"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-text-primary">
                  Typography
                  <select
                    value={draft.headingFont}
                    onChange={(e) =>
                      patchDraft({
                        headingFont: e.target
                          .value as ThemeConfig["headingFont"],
                      })
                    }
                    className={selectClass}
                  >
                    {FONT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-primary">
                  Card style
                  <select
                    value={draft.cardStyle}
                    onChange={(e) =>
                      patchDraft({
                        cardStyle: e.target.value as ThemeConfig["cardStyle"],
                      })
                    }
                    className={selectClass}
                  >
                    {CARD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-primary">
                  Button style
                  <select
                    value={draft.buttonStyle}
                    onChange={(e) =>
                      patchDraft({
                        buttonStyle: e.target
                          .value as ThemeConfig["buttonStyle"],
                      })
                    }
                    className={selectClass}
                  >
                    {BUTTON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-primary">
                  Background
                  <select
                    value={draft.backgroundStyle}
                    onChange={(e) =>
                      patchDraft({
                        backgroundStyle: e.target
                          .value as ThemeConfig["backgroundStyle"],
                      })
                    }
                    className={selectClass}
                  >
                    {BG_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-primary">
                  Header
                  <select
                    value={draft.headerStyle}
                    onChange={(e) =>
                      patchDraft({
                        headerStyle: e.target
                          .value as ThemeConfig["headerStyle"],
                      })
                    }
                    className={selectClass}
                  >
                    {HEADER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-text-primary">
                  Decorative elements
                </legend>
                <div className="mt-2 flex flex-wrap gap-5">
                  <label className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={draft.decorations.garland}
                      onChange={(e) =>
                        patchDraft({
                          decorations: {
                            ...draft.decorations,
                            garland: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 accent-brand-primary"
                    />
                    Garland strip
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={draft.decorations.cornerFlourish}
                      onChange={(e) =>
                        patchDraft({
                          decorations: {
                            ...draft.decorations,
                            cornerFlourish: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 accent-brand-primary"
                    />
                    Divider flourish
                  </label>
                </div>
              </fieldset>

              <div className="mt-5">
                <p className="text-sm font-medium text-text-primary">
                  Cover image
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="Theme cover image"
                    onChange={(e) => {
                      void uploadCover(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  {draft.coverImageUrl ? (
                    <>
                      <img
                        src={draft.coverImageUrl}
                        alt="Cover preview"
                        className="h-16 w-28 rounded-lg border border-border-default object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-text-primary hover:border-text-secondary"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => patchDraft({ coverImageUrl: null })}
                        className="h-10 rounded-lg border border-border-default px-4 text-sm text-error hover:border-error"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="h-16 rounded-lg border border-dashed border-border-default px-5 text-sm font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary"
                    >
                      Upload cover image
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  Text contrast is protected with a dark overlay.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Live preview
            </h2>
            {previewData.menu ? (
              <ThemePreview
                theme={draft}
                restaurant={previewData.restaurant}
                menu={previewData.menu}
              />
            ) : (
              <>
                <ThemePreview
                  theme={draft}
                  restaurant={previewData.restaurant}
                  menu={null}
                />
                <p className="text-xs text-text-secondary">
                  Showing sample dishes — publish a menu to preview your real
                  content.
                </p>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
