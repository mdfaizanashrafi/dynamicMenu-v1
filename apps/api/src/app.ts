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

/**
 * Never write credentials to the request log: strip Authorization and the
 * local-dev auth headers from the serialized request (Phase 17 audit found
 * bearer tokens were being logged in full).
 */
const redactHeaders = (headers: unknown): unknown => {
  if (!headers || typeof headers !== "object") return headers;
  const clone = { ...(headers as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (/^(authorization|x-dev-clerk-id|x-dev-email|x-dev-name)$/i.test(key)) {
      clone[key] = "[redacted]";
    }
  }
  return clone;
};

export function createApp(verifier?: AuthVerifier): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
  app.use(express.json({ limit: "1mb" }));
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return { ...req, headers: redactHeaders(req.headers) };
        },
        res(res) {
          return res;
        },
      },
    })
  );

  // Uploaded images (logo) served from the local storage provider (dev/CI).
  app.use("/uploads", express.static(env.UPLOAD_DIR));

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
