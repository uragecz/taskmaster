import { MikroORM } from "@mikro-orm/postgresql";
import config from "./mikro-orm.config";

let orm: MikroORM | undefined;

export async function initORM(): Promise<MikroORM> {
  if (!orm) {
    orm = await MikroORM.init(config);
  }
  return orm;
}

export function getORM(): MikroORM {
  if (!orm) {
    throw new Error("ORM not initialized. Call initORM() first.");
  }
  return orm;
}

export async function closeORM(): Promise<void> {
  if (orm) {
    await orm.close();
    orm = undefined;
  }
}
