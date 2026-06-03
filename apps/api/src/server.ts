import "reflect-metadata";
import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { closeORM, initORM } from "./db";
import { closeRealtime, initRealtime } from "./realtime";

async function main(): Promise<void> {
  await initORM();
  const app = createApp();

  // Wrap Express in an HTTP server so Socket.io can share the same port.
  const httpServer = createServer(app);
  initRealtime(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down...`);
    await new Promise((r) => httpServer.close(r));
    await closeRealtime();
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
