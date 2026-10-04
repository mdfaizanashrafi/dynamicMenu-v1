import { z } from "zod";

export const createMenuSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export const updateMenuSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export const createSectionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).optional(),
});

export const updateSectionSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(300).optional(),
    isHidden: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().min(1)).min(1).max(100),
});

const price = z.coerce.number().nonnegative().max(999_999.99);

const dietaryTags = z
  .array(z.enum(["VEG", "NON_VEG", "VEGAN", "SPICY", "GLUTEN_FREE"]))
  .max(5)
  .optional();

const variantInput = z.object({
  name: z.string().trim().min(1).max(60),
  price,
  isAvailable: z.boolean().optional(),
});

const addonInput = z.object({
  name: z.string().trim().min(1).max(60),
  price,
  isAvailable: z.boolean().optional(),
});

export const createItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  price,
  isAvailable: z.boolean().optional(),
  dietaryTags,
  variants: z.array(variantInput).max(20).optional(),
  addons: z.array(addonInput).max(30).optional(),
});

export const updateItemSchema = createItemSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
