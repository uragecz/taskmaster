import "reflect-metadata";
import type { RequiredEntityData } from "@mikro-orm/core";
import { closeORM, initORM } from "../db";
import { Todo } from "../entities/Todo";

/** Initial demo data — mirrors the todos the assignment shipped with. */
const SEED: RequiredEntityData<Todo>[] = [
  {
    text: "Complete project proposal",
    done: false,
    priority: "high",
    category: "work",
    dueDate: "2026-01-10",
    createdAt: new Date("2026-01-05T10:00:00Z"),
  },
  {
    text: "Buy groceries",
    done: true,
    priority: "medium",
    category: "shopping",
    createdAt: new Date("2026-01-04T08:00:00Z"),
    completedAt: new Date("2026-01-04T14:30:00Z"),
  },
  {
    text: "Schedule dentist appointment",
    done: false,
    priority: "low",
    category: "health",
    dueDate: "2026-01-15",
    createdAt: new Date("2026-01-03T09:00:00Z"),
  },
  {
    text: "Review pull requests",
    done: false,
    priority: "high",
    category: "work",
    dueDate: "2026-01-08",
    createdAt: new Date("2026-01-06T11:00:00Z"),
  },
  {
    text: "Call mom",
    done: false,
    priority: "medium",
    category: "personal",
    createdAt: new Date("2026-01-06T12:00:00Z"),
  },
];

async function seed(): Promise<void> {
  const orm = await initORM();
  const em = orm.em.fork();

  await em.nativeDelete(Todo, {});
  for (const data of SEED) {
    em.create(Todo, data);
  }
  await em.flush();

  // eslint-disable-next-line no-console
  console.log(`🌱 Seeded ${SEED.length} todos`);
  await closeORM();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", err);
  process.exit(1);
});
