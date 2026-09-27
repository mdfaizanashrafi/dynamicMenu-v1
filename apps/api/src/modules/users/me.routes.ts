import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";

/** Current-user profile: identity + tenant memberships. */
export function createMeRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.get(
    "/",
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const user = req.user!;
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    })
  );

  return router;
}
