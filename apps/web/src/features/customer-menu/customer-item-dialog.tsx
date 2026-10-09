import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { formatPrice } from "../menus/format-price";
import type {
  CustomerMenuItem,
  CustomerMenuItemVariant,
} from "./customer-menu.types";
import { DietaryTagBadge } from "./dietary-tag-badge";

interface Props {
  item: CustomerMenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerItemDialog({ item, open, onOpenChange }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<CustomerMenuItemVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState(false);

  const basePrice = item?.price ?? 0;
  const total = useMemo(() => {
    if (!item) return 0;
    let sum = basePrice;
    if (selectedVariant) sum += selectedVariant.price;
    item.addons
      .filter((a) => selectedAddons.has(a.id))
      .forEach((a) => (sum += a.price));
    return sum;
  }, [item, basePrice, selectedVariant, selectedAddons]);

  if (!item) return null;

  const availableVariants = item.variants.filter((v) => v.isAvailable);
  const availableAddons = item.addons.filter((a) => a.isAvailable);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl p-5 outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
          style={{
            background: "var(--tm-surface)",
            color: "var(--tm-text)",
          }}
        >
          <Dialog.Title className="sr-only">{item.name}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Customize {item.name} and add to your order.
          </Dialog.Description>

          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="mb-4 h-48 w-full rounded-xl object-cover"
            />
          ) : (
            <div
              className="mb-4 flex h-48 w-full items-center justify-center rounded-xl text-4xl"
              style={{ background: "var(--tm-bg)" }}
            >
              🍽
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{item.name}</h2>
            <span className="shrink-0 text-lg font-bold" style={{ color: "var(--tm-primary)" }}>
              {formatPrice(total)}
            </span>
          </div>

          {item.description && (
            <p className="mt-2 text-sm opacity-80">{item.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-1">
            {item.dietaryTags.map((tag) => (
              <DietaryTagBadge key={tag} tag={tag} />
            ))}
          </div>

          {availableVariants.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">Choose a variant</h3>
              <div className="mt-2 space-y-2">
                {availableVariants.map((variant) => (
                  <label
                    key={variant.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-3"
                    style={{ background: "var(--tm-bg)" }}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="variant"
                        value={variant.id}
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => setSelectedVariant(variant)}
                        className="h-4 w-4 accent-current"
                      />
                      <span className="text-sm font-medium">{variant.name}</span>
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--tm-primary)" }}>
                      {formatPrice(variant.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {availableAddons.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">Add-ons</h3>
              <div className="mt-2 space-y-2">
                {availableAddons.map((addon) => {
                  const checked = selectedAddons.has(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-3"
                      style={{ background: "var(--tm-bg)" }}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(selectedAddons);
                            if (checked) next.delete(addon.id);
                            else next.add(addon.id);
                            setSelectedAddons(next);
                          }}
                          className="h-4 w-4 accent-current"
                        />
                        <span className="text-sm font-medium">{addon.name}</span>
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--tm-primary)" }}
                      >
                        +{formatPrice(addon.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!item.isAvailable || added}
            onClick={handleAdd}
            className="mt-6 h-12 w-full text-sm font-bold disabled:opacity-60"
            style={{
              background: "var(--tm-primary)",
              color: "var(--tm-bg)",
              borderRadius: "var(--tm-button-radius)",
            }}
          >
            {added ? "Added" : item.isAvailable ? "Add to order" : "Unavailable"}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
