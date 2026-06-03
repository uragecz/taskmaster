import type { FilterQuery } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Todo } from "../../entities/Todo";
import type { ListTodoQuery } from "./validation";

export interface TodoStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
}

/**
 * Data-access layer for todos. Every query is scoped to a user id, so users
 * only ever see their own todos. Bound to the request-scoped EntityManager.
 */
export class TodoRepository {
  constructor(private readonly em: EntityManager) {}

  findWithFilters(filters: ListTodoQuery, userId: number): Promise<Todo[]> {
    const where: FilterQuery<Todo> = { user: userId };

    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.status === "completed") where.done = true;
    else if (filters.status === "active") where.done = false;
    if (filters.search) where.text = { $ilike: `%${filters.search}%` };

    return this.em.find(Todo, where, { orderBy: { createdAt: "asc" } });
  }

  findById(id: number, userId: number): Promise<Todo | null> {
    return this.em.findOne(Todo, { id, user: userId });
  }

  /** All four stats in a single aggregate query (one round-trip). */
  async getStats(userId: number): Promise<TodoStats> {
    const today = new Date().toISOString().slice(0, 10);
    const knex = this.em.getKnex();

    const row = await knex("todo")
      .where("user_id", userId)
      .select(
        knex.raw("count(*)::int as total"),
        knex.raw("count(*) filter (where done)::int as completed"),
        knex.raw(
          "count(*) filter (where not done and due_date < ?)::int as overdue",
          [today],
        ),
      )
      .first<{ total: number; completed: number; overdue: number }>();

    const total = row?.total ?? 0;
    const completed = row?.completed ?? 0;
    const overdue = row?.overdue ?? 0;
    return { total, completed, active: total - completed, overdue };
  }
}
