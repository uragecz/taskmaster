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

export const listTodos = asyncHandler(async (req: Request, res: Response) => {
  const filters = listQuerySchema.parse(req.query);
  const svc = service();
  const [todos, stats] = await Promise.all([svc.list(filters), svc.stats()]);
  res.json({ todos, categories: CATEGORIES_META, stats });
});

export const createTodo = asyncHandler(async (req: Request, res: Response) => {
  const input = createTodoSchema.parse(req.body);
  const todo = await service().create(input);
  res.status(201).json(todo);
});

export const updateTodo = asyncHandler(async (req: Request, res: Response) => {
  const id = idParamSchema.parse(req.params.id);
  const input = updateTodoSchema.parse(req.body);
  const todo = await service().update(id, input);
  res.json(todo);
});

export const deleteTodo = asyncHandler(async (req: Request, res: Response) => {
  const id = idParamSchema.parse(req.params.id);
  await service().remove(id);
  res.status(204).send();
});
