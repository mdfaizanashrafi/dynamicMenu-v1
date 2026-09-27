import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
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

export const env = parsed.data;
