import { Router } from "express";
import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodo,
} from "./controller";

const router = Router();

router.get("/", listTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export { router as todoRouter };
