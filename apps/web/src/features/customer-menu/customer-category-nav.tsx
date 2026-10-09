import type { CustomerMenuSection } from "./customer-menu.types";

interface Props {
  sections: CustomerMenuSection[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
}

/** Sticky horizontal category navigation for mobile (DESIGN.md §14). */
export function CustomerCategoryNav({
  sections,
  activeSectionId,
  onSelect,
}: Props) {
  return (
    <nav className="sticky top-0 z-30 mt-4 border-y border-white/10 py-2 backdrop-blur-md">
      <div className="mx-auto max-w-2xl">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {sections.map((section) => {
            const active = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(section.id)}
                className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--tm-primary)" : "var(--tm-surface)",
                  color: active ? "var(--tm-bg)" : "var(--tm-text)",
                }}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
