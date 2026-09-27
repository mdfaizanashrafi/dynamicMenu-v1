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

export const updateRestaurantSchema = createRestaurantSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
