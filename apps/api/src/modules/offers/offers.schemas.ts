import { z } from "zod";

export const createOfferSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  badgeText: z.string().trim().max(40).optional(),
  imageUrl: z.url().optional(),
  discountType: z.enum(["PERCENT", "FLAT"]).nullable().optional(),
  discountValue: z.coerce.number().positive().max(100000).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const updateOfferSchema = createOfferSchema.partial();

export type CreateOfferBody = z.infer<typeof createOfferSchema>;
export type UpdateOfferBody = z.infer<typeof updateOfferSchema>;
