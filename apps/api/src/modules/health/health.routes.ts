import type { Request, Response } from "express";
import { Router } from "express";
import { env } from "../../config/env.js";
import { checkDatabase } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    if (!env.DATABASE_URL) {
      res.status(200).json({
        success: true,
        data: {
          status: "ok",
          database: "unconfigured",
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    let database: "ok" | "error" = "ok";
    try {
      await checkDatabase();
    } catch {
      database = "error";
    }

    res.status(database === "error" ? 503 : 200).json({
      success: true,
      data: {
        status: database === "error" ? "degraded" : "ok",
        database,
        timestamp: new Date().toISOString(),
      },
    });
  })
);
