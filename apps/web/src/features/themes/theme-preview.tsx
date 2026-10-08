import type { CSSProperties } from "react";
import type { ThemeConfig, ThemePreviewData } from "./theme.types";
import { themeToTokens } from "./theme-to-tokens";

interface Props {
  theme: ThemeConfig;
  restaurant: ThemePreviewData["restaurant"];
  menu: ThemePreviewData["menu"];
}

const SAMPLE_ITEMS = [
  { id: "s1", name: "Paneer Tikka", description: "Char-grilled cottage cheese", price: 240, imageUrl: null, isAvailable: true },
  { id: "s2", name: "Butter Chicken", description: "Creamy tomato gravy", price: 320, imageUrl: null, isAvailable: true },
  { id: "s3", name: "Gulab Jamun", description: "Warm rose syrup dumplings", price: 120, imageUrl: null, isAvailable: false },
];

/**
 * Customer-menu preview rendered with theme tokens (DESIGN.md §12.3 live
 * preview). The same token pipeline will style the real customer menu in
 * Phase 6 — themes are presentation only and never touch menu data.
 */
export function ThemePreview({ theme, restaurant, menu }: Props) {
  const tokens = themeToTokens(theme);
  const style = {
    ...tokens.cssVars,
    background: tokens.background,
    color: "var(--tm-text)",
    fontFamily: "var(--tm-font)",
  } as CSSProperties;

  const sections = menu
    ? menu.sections.filter((s) => !s.isHidden)
    : [{ id: "sample", name: "Must Try", items: SAMPLE_ITEMS }];
  const visibleSections = sections.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.isAvailable),
  }));

  return (
    <div
      data-theme-preview
      style={style}
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-border-default shadow-lg"
    >
      {theme.decorations.garland && (
        <div
          aria-hidden
          className="flex justify-center gap-2 py-2"
          style={{ background: "var(--tm-secondary)" }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full"
              style={{
                background: i % 2 ? "var(--tm-primary)" : "var(--tm-surface)",
              }}
            />
          ))}
        </div>
      )}

      <header
        className={
          theme.headerStyle === "minimal"
            ? "flex items-center gap-3 px-5 pt-5"
            : "flex items-center gap-3 px-5 pb-5 pt-8"
        }
        style={
          theme.headerStyle === "banner"
            ? { background: "var(--tm-secondary)" }
            : undefined
        }
      >
        {(theme.headerStyle === "logo" || restaurant.logoUrl) &&
          restaurant.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt=""
              className="h-12 w-12 rounded-full border-2 object-cover"
              style={{ borderColor: "var(--tm-primary)" }}
            />
          )}
        <div>
          <h3 className="text-xl font-bold">{restaurant.name}</h3>
          {menu?.description && (
            <p className="text-xs opacity-70">{menu.description}</p>
          )}
        </div>
      </header>

      {theme.decorations.cornerFlourish && (
        <div
          aria-hidden
          className="mx-5 mt-3 h-1.5 rounded-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, var(--tm-primary) 0 12px, transparent 12px 20px)",
          }}
        />
      )}

      <div className="space-y-5 px-5 py-5">
        {visibleSections.map((section) => (
          <section key={section.id}>
            <h4
              className="mb-2 text-sm font-bold uppercase tracking-wide"
              style={{ color: "var(--tm-primary)" }}
            >
              {section.name}
            </h4>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 p-3"
                  style={{
                    background: "var(--tm-surface)",
                    borderRadius: "var(--tm-card-radius)",
                    boxShadow:
                      theme.cardStyle === "elevated"
                        ? "0 4px 14px rgba(0,0,0,0.18)"
                        : theme.cardStyle === "outlined"
                          ? "inset 0 0 0 1px var(--tm-primary)"
                          : undefined,
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ background: "var(--tm-bg)" }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    {item.description && (
                      <p className="truncate text-xs opacity-70">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold" style={{ color: "var(--tm-primary)" }}>
                    {item.price}
                  </span>
                </li>
              ))}
              {section.items.length === 0 && (
                <li className="p-3 text-xs opacity-60">
                  No available items in this section.
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>

      <div className="px-5 pb-6">
        <button
          type="button"
          tabIndex={-1}
          className="h-11 w-full text-sm font-bold"
          style={{
            background: "var(--tm-primary)",
            color: "var(--tm-bg)",
            borderRadius: "var(--tm-button-radius)",
          }}
        >
          View Cart
        </button>
      </div>
    </div>
  );
}
