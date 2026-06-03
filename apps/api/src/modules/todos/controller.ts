import type { Request, Response } from "express";
import { getORM } from "../../db";
import { asyncHandler } from "../../utils/asyncHandler";
import { CATEGORIES_META } from "./constants";
import { TodoService } from "./service";
import {
  createTodoSchema,
  idParamSchema,
  listQuerySchema,
  updateTodoSchema,
} from "./validation";

/** New service bound to the current request-scoped EntityManager. */
const service = (): TodoService => new TodoService(getORM().em);

// requireAuth runs before these handlers, so req.userId is always set.
const currentUser = (req: Request): number => req.userId as number;

export const listTodos = asyncHandler(async (req: Request, res: Response) => {
  const filters = listQuerySchema.parse(req.query);
  const userId = currentUser(req);
  const svc = service();
  const [todos, stats] = await Promise.all([
    svc.list(filters, userId),
    svc.stats(userId),
  ]);
  res.json({ todos, categories: CATEGORIES_META, stats });
});

export const createTodo = asyncHandler(async (req: Request, res: Response) => {
  const input = createTodoSchema.parse(req.body);
  const todo = await service().create(input, currentUser(req));
  res.status(201).json(todo);
});

export const updateTodo = asyncHandler(async (req: Request, res: Response) => {
  const id = idParamSchema.parse(req.params.id);
  const input = updateTodoSchema.parse(req.body);
  const todo = await service().update(id, input, currentUser(req));
  res.json(todo);
});

export const deleteTodo = asyncHandler(async (req: Request, res: Response) => {
  const id = idParamSchema.parse(req.params.id);
  await service().remove(id, currentUser(req));
  res.status(204).send();
});
