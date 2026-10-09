import { useState } from "react";
import type { CustomerMenuSection, CustomerMenuItem } from "./customer-menu.types";
import { CustomerItemCard } from "./customer-item-card";
import { CustomerItemDialog } from "./customer-item-dialog";

interface Props {
  sections: CustomerMenuSection[];
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}

export function CustomerMenuSections({ sections, sectionRefs }: Props) {
  const [selectedItem, setSelectedItem] = useState<CustomerMenuItem | null>(null);

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          ref={(el) => {
            sectionRefs.current[section.id] = el;
          }}
        >
          <h2
            className="mb-1 text-sm font-bold uppercase tracking-wide"
            style={{ color: "var(--tm-primary)" }}
          >
            {section.name}
          </h2>
          {section.description && (
            <p className="mb-3 text-sm opacity-70">{section.description}</p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <li key={item.id}>
                <CustomerItemCard item={item} onSelect={() => setSelectedItem(item)} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <CustomerItemDialog
        item={selectedItem}
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />
    </div>
  );
}
