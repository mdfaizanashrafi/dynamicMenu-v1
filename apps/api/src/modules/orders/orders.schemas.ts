import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().min(1).max(30),
  customerEmail: z.string().trim().email().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(99),
        variantId: z.string().optional(),
        addonIds: z.array(z.string()).default([]),
      })
    )
    .min(1, "At least one item is required."),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "SERVED",
    "PAID",
    "COMPLETED",
    "CANCELLED",
    "REJECTED",
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
