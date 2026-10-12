import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export interface OfferDto {
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

type OfferRow = Prisma.OfferGetPayload<object>;

function toDto(o: OfferRow): OfferDto {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    badgeText: o.badgeText,
    imageUrl: o.imageUrl,
    discountType: (o.discountType as OfferDto["discountType"]) ?? null,
    discountValue: o.discountValue?.toNumber() ?? null,
    startsAt: o.startsAt?.toISOString() ?? null,
    endsAt: o.endsAt?.toISOString() ?? null,
    isActive: o.isActive,
    position: o.position,
  };
}

/** Schedule-aware: an offer is "live" only inside its window (if any). */
function withinSchedule(o: OfferRow, now = new Date()): boolean {
  if (o.startsAt && o.startsAt > now) return false;
  if (o.endsAt && o.endsAt < now) return false;
  return true;
}

/** Live offers for the customer menu: active flag + inside schedule. */
export async function listActiveOffers(restaurantId: string): Promise<OfferDto[]> {
  const offers = await prisma.offer.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { position: "asc" },
  });
  return offers.filter((o) => withinSchedule(o)).map(toDto);
}

/**
 * Best applicable order discount for a new order. Only scheduled,
 * discount-bearing offers compete; the largest discount wins. Computed
 * server-side at order creation so the frontend can never set prices.
 */
export async function bestActiveDiscount(
  restaurantId: string,
  subtotal: number
): Promise<{ offerId: string; discount: number } | null> {
  if (subtotal <= 0) return null;
  const offers = await prisma.offer.findMany({
    where: {
      restaurantId,
      isActive: true,
      discountType: { not: null },
      discountValue: { not: null },
    },
  });

  let best: { offerId: string; discount: number } | null = null;
  for (const offer of offers) {
    if (!withinSchedule(offer)) continue;
    const value = offer.discountValue!.toNumber();
    const discount =
      offer.discountType === "PERCENT"
        ? Math.min(subtotal, Math.floor((subtotal * value) / 100))
        : Math.min(subtotal, value);
    if (discount > 0 && (!best || discount > best.discount)) {
      best = { offerId: offer.id, discount };
    }
  }
  return best;
}

// ── Dashboard management (PHASES.md §17) ──────────────────────────────────

export function listAllOffers(restaurantId: string): Promise<OfferDto[]> {
  return prisma.offer
    .findMany({ where: { restaurantId }, orderBy: { position: "asc" } })
    .then((rows) => rows.map(toDto));
}

export interface CreateOfferInput {
  title: string;
  description?: string;
  badgeText?: string;
  imageUrl?: string;
  discountType?: "PERCENT" | "FLAT" | null;
  discountValue?: number;
  startsAt?: string | Date;
  endsAt?: string | Date;
  isActive?: boolean;
}

export type UpdateOfferInput = Partial<Omit<CreateOfferInput, "discountType">> & {
  discountType?: "PERCENT" | "FLAT" | null;
};

function validateDiscount(input: CreateOfferInput): void {
  if (input.discountType && !(input.discountValue && input.discountValue > 0)) {
    throw new ApiError(
      400,
      "OFFER_INVALID_DISCOUNT",
      "discountValue must be positive when discountType is set."
    );
  }
  if (input.discountType === "PERCENT" && (input.discountValue ?? 0) > 100) {
    throw new ApiError(
      400,
      "OFFER_INVALID_DISCOUNT",
      "Percent discounts cannot exceed 100."
    );
  }
  if (input.startsAt && input.endsAt && new Date(input.startsAt) > new Date(input.endsAt)) {
    throw new ApiError(
      400,
      "OFFER_INVALID_SCHEDULE",
      "startsAt must be before endsAt."
    );
  }
}

export async function createOffer(restaurantId: string, input: CreateOfferInput) {
  validateDiscount(input);
  const last = await prisma.offer.findFirst({
    where: { restaurantId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const offer = await prisma.offer.create({
    data: {
      restaurantId,
      title: input.title,
      description: input.description ?? null,
      badgeText: input.badgeText ?? null,
      imageUrl: input.imageUrl ?? null,
      discountType: input.discountType ?? null,
      discountValue:
        input.discountType && input.discountValue != null
          ? new Prisma.Decimal(input.discountValue)
          : null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      isActive: input.isActive ?? true,
      position: (last?.position ?? -1) + 1,
    },
  });
  return toDto(offer);
}

export async function updateOffer(
  restaurantId: string,
  offerId: string,
  input: UpdateOfferInput
) {
  const existing = await prisma.offer.findFirst({ where: { id: offerId, restaurantId } });
  if (!existing) {
    throw new ApiError(404, "OFFER_NOT_FOUND", "The requested offer could not be found.");
  }
  const effectiveType = input.discountType !== undefined
    ? input.discountType
    : (existing.discountType as "PERCENT" | "FLAT" | null);
  const effectiveValue = input.discountValue !== undefined
    ? input.discountValue
    : existing.discountValue?.toNumber();
  validateDiscount({ title: input.title ?? existing.title, discountType: effectiveType ?? undefined, discountValue: effectiveValue });

  // Clearing the discount type also clears the value.
  const clearingDiscount = input.discountType === null;

  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      ...(input.badgeText !== undefined ? { badgeText: input.badgeText ?? null } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl ?? null } : {}),
      ...(input.discountType !== undefined
        ? { discountType: input.discountType ?? null }
        : {}),
      ...(input.discountValue !== undefined
        ? { discountValue: new Prisma.Decimal(input.discountValue) }
        : {}),
      ...(clearingDiscount ? { discountValue: null } : {}),
      ...(input.startsAt !== undefined
        ? { startsAt: input.startsAt ? new Date(input.startsAt) : null }
        : {}),
      ...(input.endsAt !== undefined
        ? { endsAt: input.endsAt ? new Date(input.endsAt) : null }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  return toDto(offer);
}

export async function deleteOffer(restaurantId: string, offerId: string) {
  const existing = await prisma.offer.findFirst({ where: { id: offerId, restaurantId } });
  if (!existing) {
    throw new ApiError(404, "OFFER_NOT_FOUND", "The requested offer could not be found.");
  }
  await prisma.offer.delete({ where: { id: offerId } });
  return { deleted: true };
}
