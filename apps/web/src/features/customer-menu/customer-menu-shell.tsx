import { useMemo, useRef, useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { themeToTokens } from "../themes/theme-to-tokens";
import type { CustomerMenuData } from "./customer-menu.types";
import { CustomerMenuHeader } from "./customer-menu-header";
import { CustomerOffers } from "./customer-offers";
import { CustomerMenuSections } from "./customer-menu-sections";
import { CustomerCategoryNav } from "./customer-category-nav";
import { CustomerEmptyMenu } from "./customer-empty-menu";

interface Props {
  data: CustomerMenuData;
}

export function CustomerMenuShell({ data }: Props) {
  const { restaurant, table, menu, theme, offers } = data;
  const tokens = useMemo(() => themeToTokens(theme), [theme]);
  const containerStyle = {
    ...tokens.cssVars,
    background: tokens.background,
    color: "var(--tm-text)",
    fontFamily: "var(--tm-font)",
  } as CSSProperties;

  const visibleSections = menu?.sections.filter((s) => !s.isHidden) ?? [];
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    visibleSections[0]?.id ?? null
  );

  useEffect(() => {
    if (visibleSections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    visibleSections.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSectionId(id);
    }
  };

  return (
    <div style={containerStyle} className="min-h-dvh">
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

      <CustomerMenuHeader restaurant={restaurant} table={table} theme={theme} />

      {offers.length > 0 && <CustomerOffers offers={offers} />}

      {visibleSections.length > 0 && (
        <CustomerCategoryNav
          sections={visibleSections}
          activeSectionId={activeSectionId}
          onSelect={scrollToSection}
        />
      )}

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        {menu && visibleSections.length > 0 ? (
          <CustomerMenuSections
            sections={visibleSections}
            sectionRefs={sectionRefs}
          />
        ) : (
          <CustomerEmptyMenu />
        )}
      </main>

      {theme.decorations.cornerFlourish && (
        <div
          aria-hidden
          className="pointer-events-none fixed bottom-0 right-0 h-24 w-24 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 100% 100%, var(--tm-primary) 0 40%, transparent 40%)",
          }}
        />
      )}
    </div>
  );
}
