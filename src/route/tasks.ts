import { Router } from "express";
import { authenticate } from "../dependency/middleware/auth/auth";
import {
  createTask,
  deleteTaskById,
  deleteTasksByDate,
  getTask,
  getTasks,
  updateTask,
} from "../services/tasks";

const router = Router();

router.post("/create", authenticate, createTask);
router.get("/getTasks", authenticate, getTasks);
router.get("/getTask/:task_id", authenticate, getTask);
router.patch("/updateTask/:task_id", authenticate, updateTask);
router.patch("/deleteTaskById/:task_id", authenticate, deleteTaskById);
router.patch("/deleteTasksByDate/:task_date", authenticate, deleteTasksByDate);

export default router;
