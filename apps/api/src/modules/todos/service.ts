import type { EntityManager } from "@mikro-orm/postgresql";
import { Todo } from "../../entities/Todo";
import { HttpError } from "../../middleware/errorHandler";
import { TodoRepository, type TodoStats } from "./repository";
import type {
  CreateTodoInput,
  ListTodoQuery,
  UpdateTodoInput,
} from "./validation";

/**
 * Business logic for todos. Coordinates the repository and the unit of work
 * (flush), and owns rules like "completedAt follows the done flag".
 */
export class TodoService {
  private readonly repo: TodoRepository;

  constructor(private readonly em: EntityManager) {
    this.repo = new TodoRepository(em);
  }

  list(filters: ListTodoQuery): Promise<Todo[]> {
    return this.repo.findWithFilters(filters);
  }

  stats(): Promise<TodoStats> {
    return this.repo.getStats();
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const todo = this.em.create(Todo, {
      text: input.text,
      priority: input.priority ?? "medium",
      category: input.category ?? "other",
      dueDate: input.dueDate ?? null,
    });
    await this.em.persist(todo).flush();
    return todo;
  }

  async update(id: number, input: UpdateTodoInput): Promise<Todo> {
    const todo = await this.repo.findById(id);
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

  async remove(id: number): Promise<void> {
    const todo = await this.repo.findById(id);
    if (!todo) throw new HttpError(404, "Todo not found");
    await this.em.remove(todo).flush();
  }
}
