import {
  Collection,
  Entity,
  OneToMany,
  OptionalProps,
  Property,
  Unique,
} from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Todo } from "./Todo";

@Entity()
export class User extends BaseEntity {
  [OptionalProps]?: "createdAt" | "updatedAt";

  @Property({ type: "string" })
  @Unique()
  email!: string;

  // `hidden` keeps the hash out of any serialized response.
  @Property({ type: "string", hidden: true })
  passwordHash!: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos = new Collection<Todo>(this);
}
