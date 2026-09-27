import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { sentryErrorHandler } from "./lib/sentry.js";
import { errorHandler } from "./middleware/error-handler.js";
import type { AuthVerifier } from "./modules/auth/auth.middleware.js";
import { createApiRouter } from "./routes/index.js";

export function createApp(verifier?: AuthVerifier): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger }));

  // Public endpoints are rate-limited per ARCHITECTURE.md §27.
  const publicLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  app.use("/api/v1", publicLimiter);

  app.use("/api/v1", createApiRouter(verifier));

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found." },
    });
  });

  if (sentryErrorHandler) app.use(sentryErrorHandler);
  app.use(errorHandler);

  return app;
}
