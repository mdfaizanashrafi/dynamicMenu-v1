import type { CustomerMenuOffer } from "./customer-menu.types";

interface Props {
  offers: CustomerMenuOffer[];
}

/** Horizontally scrollable offer banners on the customer menu (DESIGN.md §14). */
export function CustomerOffers({ offers }: Props) {
  return (
    <div className="mt-4 px-4">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide opacity-80">
          Offers
        </h2>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="relative w-72 shrink-0 overflow-hidden p-4 shadow-sm"
              style={{
                background: "var(--tm-surface)",
                borderRadius: "var(--tm-card-radius)",
              }}
            >
              {offer.imageUrl && (
                <img
                  src={offer.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-20"
                />
              )}
              <div className="relative">
                {offer.badgeText && (
                  <span
                    className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: "var(--tm-primary)",
                      color: "var(--tm-bg)",
                    }}
                  >
                    {offer.badgeText}
                  </span>
                )}
                <h3 className="font-semibold">{offer.title}</h3>
                {offer.description && (
                  <p className="mt-1 text-sm opacity-75">{offer.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
