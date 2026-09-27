import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Runs once before the test suite: applies pending migrations to the test
 * database defined in .env.test.
 */
export default function globalSetup(): void {
  const envFile = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
  const databaseUrl = envFile
    .split("\n")
    .find((line) => line.startsWith("DATABASE_URL="))
    ?.replace("DATABASE_URL=", "")
    .trim()
    .replace(/^"|"$/g, "");

  if (!databaseUrl) throw new Error("DATABASE_URL missing from .env.test");

  execSync(
    "npx prisma migrate deploy --schema ../../prisma/schema.prisma",
    {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "inherit",
      cwd: import.meta.dirname,
    }
  );
}
