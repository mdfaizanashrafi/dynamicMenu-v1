import { prisma } from "../../lib/prisma.js";

export interface OfferDto {
  id: string;
  title: string;
  description: string | null;
  badgeText: string | null;
  imageUrl: string | null;
}

export async function listActiveOffers(restaurantId: string): Promise<OfferDto[]> {
  const offers = await prisma.offer.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { position: "asc" },
  });
  return offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    badgeText: o.badgeText,
    imageUrl: o.imageUrl,
  }));
}
