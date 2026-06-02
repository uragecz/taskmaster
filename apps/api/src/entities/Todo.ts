import { Entity, Enum, OptionalProps, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  "personal",
  "work",
  "shopping",
  "health",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

@Entity()
export class Todo extends BaseEntity {
  // Properties with DB/runtime defaults — optional when creating via em.create().
  [OptionalProps]?: "done" | "priority" | "category" | "createdAt" | "updatedAt";

  @Property({ type: "string" })
  text!: string;

  @Property({ type: "boolean" })
  done = false;

  @Enum({ items: () => PRIORITIES })
  priority: Priority = "medium";

  @Enum({ items: () => CATEGORIES })
  category: Category = "other";

  @Property({ type: "date", nullable: true })
  dueDate?: string | null;

  @Property({ type: "datetime", nullable: true })
  completedAt?: Date | null;
}
