import { Router } from "express";
import { authenticate } from "../dependency/middleware/auth/auth";
import { createTask } from "../services/tasks";

const router = Router();

router.post("/create", authenticate, createTask);

export default router;
