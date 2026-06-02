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
 * Data-access layer for todos. Owns all query building so the service stays
 * focused on business rules. Bound to the request-scoped EntityManager.
 */
export class TodoRepository {
  constructor(private readonly em: EntityManager) {}

  findWithFilters(filters: ListTodoQuery): Promise<Todo[]> {
    const where: FilterQuery<Todo> = {};

    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.status === "completed") where.done = true;
    else if (filters.status === "active") where.done = false;
    if (filters.search) where.text = { $ilike: `%${filters.search}%` };

    return this.em.find(Todo, where, { orderBy: { createdAt: "asc" } });
  }

  findById(id: number): Promise<Todo | null> {
    return this.em.findOne(Todo, { id });
  }

  async getStats(): Promise<TodoStats> {
    const today = new Date().toISOString().slice(0, 10);

    const [total, completed, overdue] = await Promise.all([
      this.em.count(Todo, {}),
      this.em.count(Todo, { done: true }),
      this.em.count(Todo, { done: false, dueDate: { $lt: today } }),
    ]);

    return { total, completed, active: total - completed, overdue };
  }
}
