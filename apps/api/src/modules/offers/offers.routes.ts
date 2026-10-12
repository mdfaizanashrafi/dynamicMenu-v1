import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createOffer,
  deleteOffer,
  listAllOffers,
  updateOffer,
} from "./offers.service.js";
import { createOfferSchema, updateOfferSchema } from "./offers.schemas.js";
import { assertCanCreate } from "../billing/billing.service.js";

/**
 * Offer & campaign management (PHASES.md §17). MANAGER+ per the permission
 * matrix ("Offers" row). Tenant scoping via :restaurantId + membership.
 */
export function createOffersRouter(requireAuth: RequestHandler): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth, requireMembership("MANAGER"));

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      res.json({ success: true, data: await listAllOffers(restaurantId) });
    })
  );

  router.post(
    "/",
    validate({ body: createOfferSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      await assertCanCreate(restaurantId, "offers", "offers");
      const offer = await createOffer(restaurantId, req.body);
      res.status(201).json({ success: true, data: offer });
    })
  );

  router.patch(
    "/:offerId",
    validate({ body: updateOfferSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId, offerId } = req.params as {
        restaurantId: string;
        offerId: string;
      };
      const offer = await updateOffer(restaurantId, offerId, req.body);
      res.json({ success: true, data: offer });
    })
  );

  router.delete(
    "/:offerId",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId, offerId } = req.params as {
        restaurantId: string;
        offerId: string;
      };
      res.json({ success: true, data: await deleteOffer(restaurantId, offerId) });
    })
  );

  return router;
}
