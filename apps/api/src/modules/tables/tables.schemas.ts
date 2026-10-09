import { z } from "zod";

export const createTableSchema = z.object({
  label: z.string().trim().min(1).max(60),
});

export const updateTableSchema = z
  .object({
    label: z.string().trim().min(1).max(60).optional(),
    isActive: z.boolean().optional(),
    /** Issue a fresh QR token (invalidates printed codes). */
    rotateToken: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
