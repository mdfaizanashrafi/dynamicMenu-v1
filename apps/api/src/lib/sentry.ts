import * as Sentry from "@sentry/node";
import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";

export function initSentry(): void {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

export const sentryErrorHandler: ErrorRequestHandler | null = env.SENTRY_DSN
  ? Sentry.expressErrorHandler()
  : null;
