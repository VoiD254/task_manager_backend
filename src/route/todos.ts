import { Router } from "express";
import { getTodos, createTodo } from "../services/todos";

const router = Router();

router.get("/getTodos", getTodos);
router.post("/createTodo", createTodo);

export default router;
