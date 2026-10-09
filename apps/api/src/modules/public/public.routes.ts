import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { resolveCustomerMenu } from "./public.service.js";

const qrParams = z.object({ token: z.string().min(1) });

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
