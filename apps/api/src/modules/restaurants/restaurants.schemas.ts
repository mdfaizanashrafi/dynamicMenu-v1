import { z } from "zod";

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens"),
});

// Phase 2 onboarding profile — every field optional so owners can skip
// optional information and continue later (PHASES.md §6).
export const updateRestaurantSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(60)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens")
      .optional(),
    description: z.string().trim().max(1000).optional(),
    cuisine: z.string().trim().max(60).optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.string().trim().email().max(120).optional(),
    websiteUrl: z.url().optional(),
    addressLine1: z.string().trim().max(120).optional(),
    addressLine2: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(120).optional(),
    primaryColor: z
      .string()
      .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color like #F97316")
      .optional(),
    googleMapsUrl: z.url().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
