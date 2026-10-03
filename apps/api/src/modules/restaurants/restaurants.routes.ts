import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { imageStorage } from "../../services/storage.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createRestaurant,
  getRestaurantDetail,
  listMembers,
  listMyRestaurants,
  setRestaurantLogo,
  updateRestaurant,
} from "./restaurants.service.js";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "./restaurants.schemas.js";

const restaurantParams = z.object({ restaurantId: z.string().min(1) });

/** Accepted logo formats and the extension used when storing the file. */
const LOGO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_LOGO_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in LOGO_EXTENSIONS) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          "INVALID_FILE_TYPE",
          "Only JPEG, PNG or WebP images are allowed."
        )
      );
    }
  },
});

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

  router.get(
    "/:restaurantId",
    requireMembership(),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const detail = await getRestaurantDetail(restaurantId);
      res.json({ success: true, data: detail });
    })
  );

  router.patch(
    "/:restaurantId",
    requireMembership("ADMIN"),
    validate({ body: updateRestaurantSchema, params: restaurantParams }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const restaurant = await updateRestaurant(restaurantId, req.body);
      res.json({ success: true, data: restaurant });
    })
  );

  router.post(
    "/:restaurantId/logo",
    requireMembership("ADMIN"),
    upload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      if (!req.file) {
        throw new ApiError(
          400,
          "FILE_REQUIRED",
          "No image file was uploaded (field name: file)."
        );
      }
      const extension = LOGO_EXTENSIONS[req.file.mimetype];
      if (!extension) {
        // Unreachable: the fileFilter gates mimetypes. Defensive, not trusted.
        throw new ApiError(
          400,
          "INVALID_FILE_TYPE",
          "Only JPEG, PNG or WebP images are allowed."
        );
      }
      const { url } = await imageStorage.saveImage({
        buffer: req.file.buffer,
        extension,
      });
      const restaurant = await setRestaurantLogo(restaurantId, url);
      res.json({ success: true, data: restaurant });
    })
  );

  router.get(
    "/:restaurantId/members",
    requireMembership("ADMIN"),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const members = await listMembers(restaurantId);
      res.json({ success: true, data: members });
    })
  );

  return router;
}
