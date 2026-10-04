import { Router } from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { requireMembership } from "../../middleware/authorization.js";
import { validate } from "../../middleware/validate.js";
import { extensionFor, uploadImage } from "../../middleware/upload-image.js";
import { imageStorage } from "../../services/storage.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  archiveMenu,
  createItem,
  createMenu,
  createSection,
  deleteItem,
  deleteSection,
  listMenus,
  listRevisions,
  loadMenuTree,
  publishMenu,
  reorderSections,
  setItemImage,
  unpublishMenu,
  updateItem,
  updateMenu,
  updateSection,
} from "./menus.service.js";
import {
  createItemSchema,
  createMenuSchema,
  createSectionSchema,
  reorderSectionsSchema,
  updateItemSchema,
  updateMenuSchema,
  updateSectionSchema,
} from "./menus.schemas.js";

/**
 * Tenant-scoped loaders: every entity is resolved through its parent chain
 * (item → section → menu → restaurant from the URL), so a valid membership
 * for :restaurantId can never reach another tenant's rows.
 */
const requireMenu: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const { menuId } = req.params as { menuId?: string };
    const menu = await loadMenuTree(menuId ?? "");
    if (!menu) {
      throw new ApiError(404, "MENU_NOT_FOUND", "The menu could not be found.");
    }
    req.menu = menu;
    next();
  }
);

const requireSection: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const menu = req.menu!;
    const { sectionId } = req.params as { sectionId?: string };
    const section = menu.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new ApiError(
        404,
        "SECTION_NOT_FOUND",
        "The section could not be found."
      );
    }
    req.section = section;
    next();
  }
);

const requireItem: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const section = req.section!;
    const { itemId } = req.params as { itemId?: string };
    const item = section.items.find((i) => i.id === itemId);
    if (!item) {
      throw new ApiError(404, "ITEM_NOT_FOUND", "The item could not be found.");
    }
    req.item = item;
    next();
  }
);

const menuParams = z.object({ menuId: z.string().min(1) });

export function createMenusRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  // Menu management is MANAGER+ per ARCHITECTURE.md §26.
  router.use(requireAuth, requireMembership("MANAGER"));

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      res.json({ success: true, data: await listMenus(restaurantId) });
    })
  );

  router.post(
    "/",
    validate({ body: createMenuSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const { restaurantId } = req.params as { restaurantId: string };
      const menu = await createMenu(restaurantId, req.body);
      res.status(201).json({ success: true, data: menu });
    })
  );

  router.get("/:menuId", requireMenu, (req: Request, res: Response) => {
    // The loaded tree (sections → items → variants/addons + currentRevision)
    // is the full draft detail for the builder UI.
    res.json({ success: true, data: req.menu });
  });

  router.patch(
    "/:menuId",
    requireMenu,
    validate({ body: updateMenuSchema, params: menuParams }),
    asyncHandler(async (req: Request, res: Response) => {
      const menu = await updateMenu(req.menu!.id, req.body);
      res.json({ success: true, data: menu });
    })
  );

  router.delete(
    "/:menuId",
    requireMenu,
    asyncHandler(async (req: Request, res: Response) => {
      await archiveMenu(req.menu!.id);
      res.json({ success: true, data: { archived: true } });
    })
  );

  router.post(
    "/:menuId/publish",
    requireMenu,
    asyncHandler(async (req: Request, res: Response) => {
      const menu = await publishMenu(req.menu!.id);
      res.json({ success: true, data: menu });
    })
  );

  router.post(
    "/:menuId/unpublish",
    requireMenu,
    asyncHandler(async (req: Request, res: Response) => {
      const menu = await unpublishMenu(req.menu!.id);
      res.json({ success: true, data: menu });
    })
  );

  router.get(
    "/:menuId/revisions",
    requireMenu,
    asyncHandler(async (req: Request, res: Response) => {
      res.json({ success: true, data: await listRevisions(req.menu!.id) });
    })
  );

  // ── Sections ────────────────────────────────────────────────────────────

  router.post(
    "/:menuId/sections",
    requireMenu,
    validate({ body: createSectionSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const section = await createSection(req.menu!.id, req.body);
      res.status(201).json({ success: true, data: section });
    })
  );

  router.patch(
    "/:menuId/sections/:sectionId",
    requireMenu,
    requireSection,
    validate({ body: updateSectionSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const section = await updateSection(req.section!.id, req.body);
      res.json({ success: true, data: section });
    })
  );

  router.delete(
    "/:menuId/sections/:sectionId",
    requireMenu,
    requireSection,
    asyncHandler(async (req: Request, res: Response) => {
      await deleteSection(req.section!.id);
      res.json({ success: true, data: { deleted: true } });
    })
  );

  router.put(
    "/:menuId/sections/order",
    requireMenu,
    validate({ body: reorderSectionsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const sections = await reorderSections(req.menu!.id, req.body.sectionIds);
      res.json({ success: true, data: sections });
    })
  );

  // ── Items ───────────────────────────────────────────────────────────────

  router.post(
    "/:menuId/sections/:sectionId/items",
    requireMenu,
    requireSection,
    validate({ body: createItemSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const item = await createItem(req.section!.id, req.body);
      res.status(201).json({ success: true, data: item });
    })
  );

  router.patch(
    "/:menuId/sections/:sectionId/items/:itemId",
    requireMenu,
    requireSection,
    requireItem,
    validate({ body: updateItemSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const item = await updateItem(req.item!.id, req.body);
      res.json({ success: true, data: item });
    })
  );

  router.delete(
    "/:menuId/sections/:sectionId/items/:itemId",
    requireMenu,
    requireSection,
    requireItem,
    asyncHandler(async (req: Request, res: Response) => {
      await deleteItem(req.item!.id);
      res.json({ success: true, data: { deleted: true } });
    })
  );

  router.post(
    "/:menuId/sections/:sectionId/items/:itemId/image",
    requireMenu,
    requireSection,
    requireItem,
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
      const item = await setItemImage(req.item!.id, url);
      res.json({ success: true, data: item });
    })
  );

  return router;
}
