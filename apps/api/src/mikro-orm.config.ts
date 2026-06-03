import { Migrator } from "@mikro-orm/migrations";
import { defineConfig, ReflectMetadataProvider } from "@mikro-orm/postgresql";
import { env } from "./config/env";
import { BaseEntity } from "./entities/BaseEntity";
import { Todo } from "./entities/Todo";
import { User } from "./entities/User";

export default defineConfig({
  metadataProvider: ReflectMetadataProvider,
  clientUrl: env.DATABASE_URL,
  entities: [BaseEntity, Todo, User],
  debug: env.NODE_ENV === "development",
  extensions: [Migrator],
  migrations: {
    path: "dist/migrations",
    pathTs: "src/migrations",
    emit: "ts",
  },
  // Connection pool sized for many concurrent users (tuned further in Fáze 4).
  pool: { min: 2, max: 10 },
});
