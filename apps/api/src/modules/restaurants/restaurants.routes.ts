import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createRestaurant,
  listMembers,
  listMyRestaurants,
  updateRestaurant,
} from "./restaurants.service.js";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "./restaurants.schemas.js";

const restaurantParams = z.object({ restaurantId: z.string().min(1) });

export function createRestaurantsRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.use(requireAuth);

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const memberships = await listMyRestaurants(req.user!.id);
      res.json({ success: true, data: memberships });
    })
  );

  router.post(
    "/",
    validate({ body: createRestaurantSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const restaurant = await createRestaurant(req.user!.id, req.body);
      res.status(201).json({ success: true, data: restaurant });
    })
  );

  router.patch(
    "/:restaurantId",
    requireMembership("ADMIN"),
    validate({ body: updateRestaurantSchema, params: restaurantParams }),
    asyncHandler(async (req: Request, res: Response) => {
      const restaurant = await updateRestaurant(
        req.params.restaurantId!,
        req.body
      );
      res.json({ success: true, data: restaurant });
    })
  );

  router.get(
    "/:restaurantId/members",
    requireMembership("ADMIN"),
    asyncHandler(async (req: Request, res: Response) => {
      const members = await listMembers(req.params.restaurantId!);
      res.json({ success: true, data: members });
    })
  );

  return router;
}
