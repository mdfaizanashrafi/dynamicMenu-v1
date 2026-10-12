import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { listAccounts, redeemPoints } from "./loyalty.service.js";
import { assertFeature } from "../billing/billing.service.js";

const listQuery = z.object({ q: z.string().trim().max(120).optional() });

const redeemSchema = z
  .object({
    customerId: z.string().min(1).optional(),
    phone: z.string().trim().min(1).max(30).optional(),
    points: z.coerce.number().int().min(1).max(100000),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.customerId || v.phone, {
    message: "Provide customerId or phone.",
  });

/**
 * Loyalty Program management (PHASES.md §16). Staff at the counter redeem
 * points; account overview is MANAGER+. All data is restaurant-scoped.
 */
export function createLoyaltyRouter(requireAuth: RequestHandler): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.get(
    "/accounts",
    requireMembership("MANAGER"),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      await assertFeature(restaurantId, "loyalty", "The Loyalty Program");
      const { q } = listQuery.parse(req.query);
      res.json({ success: true, data: await listAccounts(restaurantId, q) });
    })
  );

  router.post(
    "/redeem",
    requireMembership("STAFF"),
    validate({ body: redeemSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      await assertFeature(restaurantId, "loyalty", "The Loyalty Program");
      const account = await redeemPoints(restaurantId, req.body);
      res.json({ success: true, data: account });
    })
  );

  return router;
}
