import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { changePlan, getSubscriptionView } from "./billing.service.js";

const changePlanSchema = z.object({
  plan: z.enum(["FREE", "STARTER", "PRO", "ENTERPRISE"]),
});

/**
 * Subscription & account management (PHASES.md §18). Viewing usage is
 * MANAGER+; changing the plan is OWNER-only. Plan changes are self-serve —
 * the project requirements define no billing provider, so no payment is
 * collected here.
 */
export function createBillingRouter(requireAuth: RequestHandler): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.get(
    "/",
    requireMembership("MANAGER"),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      res.json({ success: true, data: await getSubscriptionView(restaurantId) });
    })
  );

  router.put(
    "/plan",
    requireMembership("OWNER"),
    validate({ body: changePlanSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const subscription = await changePlan(restaurantId, req.body.plan);
      res.json({
        success: true,
        data: { plan: subscription.plan, status: subscription.status },
      });
    })
  );

  return router;
}
