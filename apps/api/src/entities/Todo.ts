import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  OptionalProps,
  Property,
} from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";

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
// Covers per-user filtering (WHERE user_id = ?) and the ordered list
// (ORDER BY created_at) in a single index.
@Index({ properties: ["user", "createdAt"] })
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

  @ManyToOne(() => User)
  user!: User;
}
