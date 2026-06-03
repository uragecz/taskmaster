import type { Request, Response } from "express";
import { getORM } from "../../db";
import { getUserId } from "../../middleware/requireAuth";
import { notifyTodosChanged } from "../../realtime";
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

export const listTodos = asyncHandler(async (req: Request, res: Response) => {
  const filters = listQuerySchema.parse(req.query);
  const userId = getUserId(req);
  const svc = service();
  const [todos, stats] = await Promise.all([
    svc.list(filters, userId),
    svc.stats(userId),
  ]);
  res.json({ todos, categories: CATEGORIES_META, stats });
});

export const createTodo = asyncHandler(async (req: Request, res: Response) => {
  const input = createTodoSchema.parse(req.body);
  const userId = getUserId(req);
  const todo = await service().create(input, userId);
  notifyTodosChanged(userId);
  res.status(201).json(todo);
});

export const updateTodo = asyncHandler(async (req: Request, res: Response) => {
  const id = idParamSchema.parse(req.params.id);
  const input = updateTodoSchema.parse(req.body);
  const userId = getUserId(req);
  const todo = await service().update(id, input, userId);
  notifyTodosChanged(userId);
  res.json(todo);
});

export const deleteTodo = asyncHandler(async (req: Request, res: Response) => {
  const id = idParamSchema.parse(req.params.id);
  const userId = getUserId(req);
  await service().remove(id, userId);
  notifyTodosChanged(userId);
  res.status(204).send();
});
