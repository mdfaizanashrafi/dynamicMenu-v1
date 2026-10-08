import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { extensionFor, uploadImage } from "../../middleware/upload-image.js";
import { imageStorage } from "../../services/storage.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getThemePreview, getThemeState, publishTheme, saveDraft } from "./themes.service.js";
import { themeConfigSchema } from "./themes.schemas.js";

export function createThemesRouter(requireAuth: RequestHandler): Router {
  // Theme management is MANAGER+ per ARCHITECTURE.md §26; mergeParams exposes
  // :restaurantId from the mount path to requireMembership.
  const router = Router({ mergeParams: true });

  router.use(requireAuth, requireMembership("MANAGER"));

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      res.json({ success: true, data: await getThemeState(restaurantId) });
    })
  );

  router.put(
    "/",
    validate({ body: themeConfigSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      await saveDraft(restaurantId, req.body);
      res.json({ success: true, data: await getThemeState(restaurantId) });
    })
  );

  router.post(
    "/publish",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      res.json({ success: true, data: await publishTheme(restaurantId) });
    })
  );

  router.get(
    "/preview",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      res.json({ success: true, data: await getThemePreview(restaurantId) });
    })
  );

  router.post(
    "/image",
    uploadImage,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.file) {
        throw new ApiError(
          400,
          "FILE_REQUIRED",
          "No image file was uploaded (field name: file)."
        );
      }
      const { url } = await imageStorage.saveImage({
        buffer: req.file.buffer,
        extension: extensionFor(req.file.mimetype),
      });
      res.json({ success: true, data: { url } });
    })
  );

  return router;
}
