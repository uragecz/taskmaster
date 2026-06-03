import "reflect-metadata";
import bcrypt from "bcryptjs";
import { closeORM, initORM } from "../db";
import { type Category, type Priority, Todo } from "../entities/Todo";
import { User } from "../entities/User";

// Demo credentials come from the environment (documented in .env.example).
const DEMO_EMAIL = process.env.SEED_USER_EMAIL ?? "demo@taskmaster.dev";
const DEMO_PASSWORD = process.env.SEED_USER_PASSWORD ?? "demo1234";

/** Demo todos (without an owner — the seed assigns the demo user). */
interface SeedTodo {
  text: string;
  done?: boolean;
  priority?: Priority;
  category?: Category;
  dueDate?: string;
  completedAt?: Date;
  createdAt?: Date;
}

const SEED: SeedTodo[] = [
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
  await em.nativeDelete(User, {});

  const user = em.create(User, {
    email: DEMO_EMAIL,
    passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
  });

  for (const data of SEED) {
    em.create(Todo, { ...data, user });
  }
  await em.flush();

  console.log(`🌱 Seeded ${SEED.length} todos for ${DEMO_EMAIL}`);
  await closeORM();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
