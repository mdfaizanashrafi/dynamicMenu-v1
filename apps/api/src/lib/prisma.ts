import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

export const prisma = new PrismaClient();

/** Verify the database is reachable. Throws on failure. */
export async function checkDatabase(): Promise<void> {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  await prisma.$queryRaw`SELECT 1`;
}
