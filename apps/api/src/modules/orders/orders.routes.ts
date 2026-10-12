import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  getRestaurantOrder,
  listRestaurantOrders,
  transitionOrder,
} from "./orders.service.js";
import { updateOrderStatusSchema } from "./orders.schemas.js";
import type { OrderStatus } from "@prisma/client";

const listQuery = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "SERVED",
      "PAID",
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
    ])
    .optional(),
});

/**
 * Restaurant order management (PHASES.md §12). Every member role
 * (OWNER/ADMIN/MANAGER/STAFF) can view and advance orders; tenant scoping
 * comes from the `:restaurantId` path plus requireMembership.
 */
export function createOrdersRouter(requireAuth: RequestHandler): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth, requireMembership("STAFF"));

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const { status } = listQuery.parse(req.query);
      const orders = await listRestaurantOrders(
        restaurantId,
        status as OrderStatus | undefined
      );
      res.json({ success: true, data: orders });
    })
  );

  router.get(
    "/:orderId",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId, orderId } = req.params as {
        restaurantId: string;
        orderId: string;
      };
      const order = await getRestaurantOrder(restaurantId, orderId);
      res.json({ success: true, data: order });
    })
  );

  router.patch(
    "/:orderId",
    validate({ body: updateOrderStatusSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId, orderId } = req.params as {
        restaurantId: string;
        orderId: string;
      };
      const order = await transitionOrder(restaurantId, orderId, req.body.status);
      res.json({ success: true, data: order });
    })
  );

  return router;
}
