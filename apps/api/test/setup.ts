import { readFileSync } from "node:fs";

/**
 * Loads .env.test into process.env before any test module imports the app,
 * so config/env.ts sees the test database URL.
 */
export default function setup(): void {
  const envFile = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
  for (const line of envFile.split("\n")) {
    const match = /^([A-Z_]+)="?(.*?)"?$/.exec(line);
    if (match?.[1]) {
      process.env[match[1]] = match[2];
    }
  }
}
