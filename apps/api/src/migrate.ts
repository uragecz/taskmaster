import "reflect-metadata";
import { logger } from "./config/logger";
import { closeORM, initORM } from "./db";

/** Standalone migration runner — used by the container before the server starts. */
async function migrate(): Promise<void> {
  const orm = await initORM();
  const applied = await orm.getMigrator().up();
  logger.info(`Applied ${applied.length} migration(s)`);
  await closeORM();
}

migrate().catch((err) => {
  logger.error({ err }, "Migration failed");
  process.exit(1);
});
