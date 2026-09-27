import * as Sentry from "@sentry/react";
import { env } from "../config/env";

export function initSentry(): void {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.isProduction ? "production" : "development",
    tracesSampleRate: env.isProduction ? 0.1 : 1.0,
  });
}
