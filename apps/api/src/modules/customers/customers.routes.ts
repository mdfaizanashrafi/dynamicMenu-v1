import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getCustomerDetail, listCustomers } from "./customers.service.js";

const listQuery = z.object({ q: z.string().trim().max(120).optional() });

/**
 * Customer management (PHASES.md §14). Per ARCHITECTURE.md §26, STAFF get a
 * limited view (list without emails); full details with order history and
 * insights require MANAGER+.
 */
export function createCustomersRouter(requireAuth: RequestHandler): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.get(
    "/",
    requireMembership("STAFF"),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const { q } = listQuery.parse(req.query);
      const data = await listCustomers(restaurantId, req.membership!.role, q);
      res.json({ success: true, data });
    })
  );

  router.get(
    "/:customerId",
    requireMembership("MANAGER"),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId, customerId } = req.params as {
        restaurantId: string;
        customerId: string;
      };
      const data = await getCustomerDetail(restaurantId, customerId);
      res.json({ success: true, data });
    })
  );

  return router;
}
