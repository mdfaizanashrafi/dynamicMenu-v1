import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Env + migrations are handled in global-setup (main thread, before
    // workers spawn); workers inherit process.env from it.
    globalSetup: ["test/global-setup.ts"],
    // Integration tests share one DB; keep them sequential.
    fileParallelism: false,
  },
});
