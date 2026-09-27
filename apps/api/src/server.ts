import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { initSentry } from "./lib/sentry.js";

initSentry();

const app = createApp();

const server = app.listen(env.API_PORT, () => {
  logger.info(
    { port: env.API_PORT, env: env.NODE_ENV },
    "DynamicMenu API listening"
  );
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
