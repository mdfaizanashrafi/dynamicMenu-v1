import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { assertFeature } from "../billing/billing.service.js";
import { prisma } from "../../lib/prisma.js";
import { getAnalytics } from "./analytics.service.js";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
  /** "org" aggregates the restaurant plus its branches (Phase 15). */
  scope: z.enum(["restaurant", "org"]).optional(),
});

/**
 * Restaurant analytics (PHASES.md §15). MANAGER+ only — financial and
 * customer-behavior data sits one level above the STAFF "limited" tier.
 * All queries are scoped by :restaurantId (tenant isolation).
 */
export function createAnalyticsRouter(requireAuth: RequestHandler): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    requireAuth,
    requireMembership("MANAGER"),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      await assertFeature(restaurantId, "analytics", "Analytics");
      const { days, scope } = querySchema.parse(req.query);
      let ids: string[] = [restaurantId];
      if (scope === "org") {
        const branches = await prisma.restaurant.findMany({
          where: { parentId: restaurantId },
          select: { id: true },
        });
        ids = [restaurantId, ...branches.map((b) => b.id)];
      }
      const data = await getAnalytics(ids, days ?? 14);
      res.json({ success: true, data });
    })
  );

  return router;
}
