import { Router } from "express";
import { authenticate } from "../dependency/middleware/auth/auth";
import {
  createTask,
  deleteTaskById,
  deleteTasksByDate,
  getTask,
  getTasks,
  syncTasks,
  updateTask,
} from "../services/tasks";
import { rateLimitApi } from "../dependency/middleware/rate-limit-middleware/apiRateLimit";
import { taskRateLimit } from "../dependency/middleware/rate-limit-middleware/taskRateLimit";

const router = Router();

router.post(
  "/create",
  authenticate,
  rateLimitApi({ maxRequests: 60 }),
  taskRateLimit(),
  createTask,
);
router.get(
  "/getTasks",
  authenticate,
  rateLimitApi({ maxRequests: 60 }),
  getTasks,
);
router.get(
  "/getTask/:task_id",
  authenticate,
  rateLimitApi({ maxRequests: 60 }),
  getTask,
);
router.patch(
  "/updateTask/:task_id",
  authenticate,
  rateLimitApi({ maxRequests: 60 }),
  updateTask,
);
router.patch(
  "/deleteTaskById/:task_id",
  authenticate,
  rateLimitApi({ maxRequests: 60 }),
  deleteTaskById,
);
router.patch(
  "/deleteTasksByDate/:task_date",
  authenticate,
  rateLimitApi({ maxRequests: 60 }),
  deleteTasksByDate,
);
router.post(
  "/sync",
  authenticate,
  rateLimitApi({ maxRequests: 30 }),
  syncTasks,
);

export default router;
