import { Request, Response } from "express";
import { CreateTask, UpdateTask } from "./interface";
import {
  createTaskDao,
  getTaskById,
  getTasksByUserId,
  updateTaskDao,
} from "./dao";
import {
  CreateTaskInput,
  CreateTaskSchema,
  GetTaskByIdSchema,
  GetTasksInput,
  GetTasksSchema,
  UpdateTaskInput,
  UpdateTaskSchema,
} from "./validation";

// "hh:mm AM/PM" to "HH:MM:SS" 24-hour format
const convertTo24Hour = (time: string): string => {
  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:00`;
};

const createTask = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    const parsedResult = CreateTaskSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res.status(400).json({
        message: "Parsing Error",
        errors: parsedResult.error.errors,
      });
    }

    const { title, task_description, task_date, task_time, notes } =
      parsedResult.data as CreateTaskInput;

    const taskDateTimeString = `${task_date}T${convertTo24Hour(task_time)}`;
    const dateTime = new Date(taskDateTimeString);

    const task: CreateTask = {
      user_id,
      title,
      task_date_time: dateTime,
      task_description,
      notes,
    };

    const createdTask = await createTaskDao(task);

    return res.status(201).json(createdTask);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getTasks = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    const parsed = GetTasksSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Parsing Error",
        errors: parsed.error.errors,
      });
    }

    const { date } = parsed.data as GetTasksInput;

    const tasks = await getTasksByUserId(user_id, date);

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getTask = async (req: Request, res: Response) => {
  try {
    const parsed = GetTaskByIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Parsing Error",
        errors: parsed.error.errors,
      });
    }

    const { task_id } = parsed.data;

    const user_id = req.user?.user_id;

    const task = await getTaskById(user_id, task_id);

    if (!task) {
      return res.status(404).json({
        message: "Not Found",
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const mergeDateTime = (
  existing: Date,
  task_date?: string,
  task_time?: string,
): Date => {
  const newDateTime = new Date(existing);

  if (task_date) {
    const [year, month, day] = task_date.split("-").map(Number);

    newDateTime.setFullYear(year, month - 1, day);
  }

  if (task_time) {
    const [hours, minutes, seconds] = convertTo24Hour(task_time)
      .split(":")
      .map(Number);

    newDateTime.setHours(hours, minutes, seconds);
  }

  return newDateTime;
};

const updateTask = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    const { task_id } = req.params;

    if (!task_id) {
      return res.status(400).json({
        message: "task_id is required",
      });
    }

    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Parsing Error",
        errors: parsed.error.errors,
      });
    }

    const { task_date, task_time, ...rest } = parsed.data as UpdateTaskInput;

    const existingTask = await getTaskById(user_id, task_id);
    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const updates: Partial<UpdateTask> = {
      ...rest,
      ...(task_date || task_time
        ? {
            task_date_time: mergeDateTime(
              existingTask.task_date_time,
              task_date,
              task_time,
            ).toISOString(),
          }
        : {}),
    };

    const updatedTask = await updateTaskDao(user_id, task_id, updates);

    return res.status(200).json(updatedTask);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export { createTask, getTasks, getTask, updateTask };
