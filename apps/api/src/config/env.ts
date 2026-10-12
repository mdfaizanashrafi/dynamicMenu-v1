// Load apps/api/.env before validating (Prisma loads its own DATABASE_URL;
// app-level vars like CLERK_SECRET_KEY need explicit loading).
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  WEB_BASE_URL: z.string().url().default("http://localhost:5173"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  UPLOAD_DIR: z.string().default("uploads"),
  ENABLE_DEV_AUTH: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${parsed.error.toString()}`
  );
}

// Production must have a real database — fail fast at boot rather than
// serving a half-configured API (health reports "unconfigured" without it).
if (parsed.data.NODE_ENV === "production" && !parsed.data.DATABASE_URL) {
  throw new Error(
    "Invalid environment configuration: DATABASE_URL is required in production."
  );
}

export const env = parsed.data;
