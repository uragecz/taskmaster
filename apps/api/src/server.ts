import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { closeORM, initORM } from "./db";

async function main(): Promise<void> {
  await initORM();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down...`);
    server.close();
    await closeORM();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
