import { Router } from "express";
import { getTodos, createTodo } from "../services/todos";

const router = Router();

router.get("/", getTodos);
router.post("/", createTodo);

export default router;
