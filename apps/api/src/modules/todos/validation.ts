import { z } from "zod";
import { CATEGORIES, PRIORITIES } from "../../entities/Todo";

const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD");

export const createTodoSchema = z.object({
  text: z.string().trim().min(1, "text is required").max(255),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
  dueDate: dueDate.nullable().optional(),
});

export const updateTodoSchema = z
  .object({
    text: z.string().trim().min(1).max(255),
    priority: z.enum(PRIORITIES),
    category: z.enum(CATEGORIES),
    dueDate: dueDate.nullable(),
    done: z.boolean(),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided",
  });

export const idParamSchema = z.coerce.number().int().positive();

export const listQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(["all", "active", "completed"]).optional(),
  search: z.string().trim().min(1).optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type ListTodoQuery = z.infer<typeof listQuerySchema>;
