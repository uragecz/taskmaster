import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Load test DB connection from .env.test instead of hardcoding it here.
config({ path: ".env.test" });

export default defineConfig({
  test: {
    globalSetup: ["./tests/global-setup.ts"],
    // Tests share one database — run them serially to avoid clashes.
    fileParallelism: false,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? "test",
      DATABASE_URL: process.env.DATABASE_URL ?? "",
    },
  },
});
