import type { EntityManager } from "@mikro-orm/postgresql";
import { Todo } from "../../entities/Todo";
import { User } from "../../entities/User";
import { HttpError } from "../../middleware/errorHandler";
import { TodoRepository, type TodoStats } from "./repository";
import type {
  CreateTodoInput,
  ListTodoQuery,
  UpdateTodoInput,
} from "./validation";

/**
 * Business logic for todos. Every operation is scoped to a user id so callers
 * can only touch their own todos. Owns rules like "completedAt follows done".
 */
export class TodoService {
  private readonly repo: TodoRepository;

  constructor(private readonly em: EntityManager) {
    this.repo = new TodoRepository(em);
  }

  list(filters: ListTodoQuery, userId: number): Promise<Todo[]> {
    return this.repo.findWithFilters(filters, userId);
  }

  stats(userId: number): Promise<TodoStats> {
    return this.repo.getStats(userId);
  }

  async create(input: CreateTodoInput, userId: number): Promise<Todo> {
    const todo = this.em.create(Todo, {
      text: input.text,
      priority: input.priority ?? "medium",
      category: input.category ?? "other",
      dueDate: input.dueDate ?? null,
      user: this.em.getReference(User, userId),
    });
    await this.em.persist(todo).flush();
    return todo;
  }

  async update(
    id: number,
    input: UpdateTodoInput,
    userId: number,
  ): Promise<Todo> {
    const todo = await this.repo.findById(id, userId);
    if (!todo) throw new HttpError(404, "Todo not found");

    if (input.text !== undefined) todo.text = input.text;
    if (input.priority !== undefined) todo.priority = input.priority;
    if (input.category !== undefined) todo.category = input.category;
    if (input.dueDate !== undefined) todo.dueDate = input.dueDate;
    if (input.done !== undefined) {
      todo.done = input.done;
      todo.completedAt = input.done ? new Date() : null;
    }

    await this.em.flush();
    return todo;
  }

  async remove(id: number, userId: number): Promise<void> {
    const todo = await this.repo.findById(id, userId);
    if (!todo) throw new HttpError(404, "Todo not found");
    await this.em.remove(todo).flush();
  }
}
