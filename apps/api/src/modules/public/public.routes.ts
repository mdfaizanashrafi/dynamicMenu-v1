import { Router } from "express";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { validate } from "../../middleware/validate.js";
import { resolveCustomerMenu } from "./public.service.js";
import { createOrder } from "../orders/orders.service.js";
import { createOrderSchema } from "../orders/orders.schemas.js";
import {
  getCustomerOrderStatus,
  recordGoogleMapsOpen,
  submitReview,
} from "../reviews/reviews.service.js";
import { submitReviewSchema } from "../reviews/reviews.schemas.js";

const qrParams = z.object({ token: z.string().min(1) });

/**
 * Write endpoints (order creation, reviews) get a stricter per-IP limit than
 * the general public 120/min — cheap insurance against spam/abuse
 * (Phase 17 security audit).
 */
const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

/**
 * Customer-facing QR resolution (ARCHITECTURE.md §9, PHASES.md §9).
 * Public by design — no auth — and exposes no internal ids: the token maps
 * to table + restaurant identity only.
 */
export const publicRouter = Router();

publicRouter.get(
  "/qr/:token",
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = qrParams.parse(req.params);
    const table = await prisma.restaurantTable.findFirst({
      where: { qrToken: token, isActive: true },
      include: {
        restaurant: { select: { name: true, slug: true, logoUrl: true } },
      },
    });
    if (!table) {
      // Helpful, non-leaky error (DESIGN.md §23 Invalid QR).
      throw new ApiError(
        404,
        "INVALID_QR",
        "This QR code is unavailable. Please ask restaurant staff for a new QR code."
      );
    }
    res.json({
      success: true,
      data: {
        restaurant: table.restaurant,
        table: { label: table.label },
      },
    });
  })
);

/**
 * Full customer menu payload for a scanned QR token (PHASES.md §10).
 * Returns restaurant + table + published menu snapshot + published theme +
 * active offers. No authentication required.
 */
publicRouter.get(
  "/qr/:token/menu",
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = qrParams.parse(req.params);
    const data = await resolveCustomerMenu(token);
    res.json({ success: true, data });
  })
);

/**
 * Create a table-specific order from a customer cart (PHASES.md §11).
 * Prices and totals are recomputed server-side from the published menu
 * snapshot; the frontend only supplies ids, quantities, and customer info.
 */
publicRouter.post(
  "/qr/:token/orders",
  writeLimiter,
  validate({ body: createOrderSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = qrParams.parse(req.params);
    const order = await createOrder(token, req.body);
    res.status(201).json({ success: true, data: order });
  })
);

/**
 * Customer-facing order status + review flow (PHASES.md §13). The token →
 * table → order chain scopes these endpoints to the customer who scanned.
 */
publicRouter.get(
  "/qr/:token/orders/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { token, orderId } = z
      .object({ token: z.string().min(1), orderId: z.string().min(1) })
      .parse(req.params);
    const data = await getCustomerOrderStatus(token, orderId);
    res.json({ success: true, data });
  })
);

publicRouter.post(
  "/qr/:token/orders/:orderId/review",
  writeLimiter,
  validate({ body: submitReviewSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, orderId } = z
      .object({ token: z.string().min(1), orderId: z.string().min(1) })
      .parse(req.params);
    const review = await submitReview(token, orderId, req.body);
    res.status(201).json({ success: true, data: review });
  })
);

/**
 * Record that the customer opened the Google Maps review link. We track the
 * redirect only and never claim the review was posted (PRD §reviews).
 */
publicRouter.post(
  "/qr/:token/orders/:orderId/review/google",
  writeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { token, orderId } = z
      .object({ token: z.string().min(1), orderId: z.string().min(1) })
      .parse(req.params);
    const data = await recordGoogleMapsOpen(token, orderId);
    res.json({ success: true, data });
  })
);
