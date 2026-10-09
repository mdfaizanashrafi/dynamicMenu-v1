import { Router } from "express";
import type { RequestHandler } from "express";
import {
  createRequireAuth,
  type AuthVerifier,
} from "../modules/auth/auth.middleware.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { createMenusRouter } from "../modules/menus/menus.routes.js";
import { publicRouter } from "../modules/public/public.routes.js";
import { createRestaurantsRouter } from "../modules/restaurants/restaurants.routes.js";
import { createTablesRouter } from "../modules/tables/tables.routes.js";
import { createThemesRouter } from "../modules/themes/themes.routes.js";
import { createMeRouter } from "../modules/users/me.routes.js";

export function createApiRouter(verifier?: AuthVerifier): Router {
  const requireAuth: RequestHandler = createRequireAuth(verifier);

  const router = Router();
  router.use("/health", healthRouter);
  router.use("/public", publicRouter);
  router.use("/me", createMeRouter(requireAuth));
  router.use("/restaurants", createRestaurantsRouter(requireAuth));
  router.use(
    "/restaurants/:restaurantId/menus",
    createMenusRouter(requireAuth)
  );
  router.use(
    "/restaurants/:restaurantId/theme",
    createThemesRouter(requireAuth)
  );
  router.use(
    "/restaurants/:restaurantId/tables",
    createTablesRouter(requireAuth)
  );
  return router;
}
