import { Request, Response } from "express";
import { ACTION, CreateTask, SyncedTask, UpdateTask } from "./interface";
import {
  createTaskDao,
  createTaskDaoForSync,
  getTaskById,
  getTasksByUserId,
  hardDeleteSoftDeletedTasks,
  markTasksAsSynced,
  softDeleteTaskById,
  softDeleteTasksByDate,
  TASKS_NAMESPACE,
  updateTaskDao,
} from "./dao";
import {
  CreateTaskInput,
  CreateTaskSchema,
  TaskByIdSchema,
  GetTasksInput,
  GetTasksSchema,
  UpdateTaskInput,
  UpdateTaskSchema,
  TaskByIdInput,
  DeleteTasksByDateSchema,
  DeleteTasksByDateInput,
  SyncTasksSchema,
  SyncTasksInput,
} from "./validation";
import pool from "../../dependency/pg";
import { CACHE } from "../../dependency/cache";

function invalidateCache(user_id: string, date: string) {
  const cacheKey = `${TASKS_NAMESPACE}:${user_id}:${date}`;

  CACHE.del(cacheKey).catch((err) => {
    console.error(`Failed to invalidate cache for ${cacheKey}:`, err);
  });
}

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
    invalidateCache(user_id, task_date);

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
    const parsed = TaskByIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Parsing Error",
        errors: parsed.error.errors,
      });
    }

    const { task_id } = parsed.data as TaskByIdInput;

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

    const oldDate = new Date(existingTask.task_date_time)
      .toISOString()
      .split("T")[0];

    const updates: Partial<UpdateTask> = {
      ...rest,
      ...(task_date || task_time
        ? {
            task_date_time: mergeDateTime(
              existingTask.task_date_time,
              task_date,
              task_time,
            ),
          }
        : {}),
    };

    const updatedTask = await updateTaskDao(user_id, task_id, updates);

    invalidateCache(user_id, oldDate);

    if (task_date) {
      await invalidateCache(user_id, task_date);
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const deleteTaskById = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    const parsedData = TaskByIdSchema.safeParse(req.params);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Parsing Error",
        errors: parsedData.error.errors,
      });
    }

    const { task_id } = parsedData.data as TaskByIdInput;

    const existingTask = await getTaskById(user_id, task_id);
    if (!existingTask) {
      return res.status(404).json({
        message: "Task Not Found or already deleted",
      });
    }

    const deleted = await softDeleteTaskById(user_id, task_id);
    if (!deleted) {
      return res.status(404).json({
        message: "Task Not Found or already deleted",
      });
    }

    const taskDate = new Date(existingTask.task_date_time)
      .toISOString()
      .split("T")[0];

    invalidateCache(user_id, taskDate);

    return res.status(200).json(deleted);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const deleteTasksByDate = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    const parsed = DeleteTasksByDateSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Parsing Error",
        errors: parsed.error.errors,
      });
    }

    const { task_date } = parsed.data as DeleteTasksByDateInput;

    const deletedTasks = await softDeleteTasksByDate(user_id, task_date);

    invalidateCache(user_id, task_date);

    return res.status(200).json({
      message: `${deletedTasks.length} task(s) deleted successfully`,
      deletedTasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const syncTasks = async (req: Request, res: Response) => {
  const user_id = req.user?.user_id;
  if (!user_id) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const parsed = SyncTasksSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Parsing error",
      errors: parsed.error.errors,
    });
  }

  const { tasks } = parsed.data as SyncTasksInput;

  const client = await pool.connect();
  const syncedTasks: SyncedTask[] = [];
  const affectedDates = new Set<string>();

  try {
    await client.query("BEGIN");

    for (const task of tasks) {
      const existingTask = await getTaskById(user_id, task.task_id, client);

      const taskDate = new Date(task.task_date_time)
        .toISOString()
        .split("T")[0];
      affectedDates.add(taskDate);

      if (
        existingTask &&
        task.is_synced &&
        new Date(task.updated_at).getTime() ===
          new Date(existingTask.updated_at).getTime()
      ) {
        syncedTasks.push({
          task_id: task.task_id,
          action: ACTION.skipped,
        });

        continue;
      }

      if (task.is_marked_for_deletion) {
        if (existingTask) {
          await softDeleteTaskById(user_id, task.task_id, client);

          syncedTasks.push({
            task_id: task.task_id,
            action: ACTION.deleted,
          });
        } else {
          syncedTasks.push({
            task_id: task.task_id,
            action: ACTION.skipped,
          });
        }

        continue;
      }

      if (existingTask) {
        await updateTaskDao(
          user_id,
          task.task_id,
          {
            title: task.title,
            task_description: task.task_description || null,
            task_date_time: new Date(task.task_date_time),
            notes: task.notes || null,
            is_completed: task.is_completed,
            updated_at: task.updated_at || new Date(),
          },
          client,
        );

        syncedTasks.push({
          task_id: task.task_id,
          action: ACTION.updated,
        });
      } else {
        await createTaskDaoForSync(
          {
            user_id,
            task_id: task.task_id,
            title: task.title,
            task_description: task.task_description,
            task_date_time: new Date(task.task_date_time),
            notes: task.notes,
            is_completed: task.is_completed,
            created_at: task.created_at,
            updated_at: task.updated_at,
          },
          client,
        );

        syncedTasks.push({
          task_id: task.task_id,
          action: ACTION.created,
        });
      }
    }

    await markTasksAsSynced(
      user_id,
      tasks.map((t) => t.task_id),
      client,
    );
    const hardDeletedTasks = await hardDeleteSoftDeletedTasks(user_id, client);

    await client.query("COMMIT");

    for (const date of affectedDates) {
      invalidateCache(user_id, date);
    }

    return res.status(200).json({
      message: "Sync completed successfully",
      syncCount: syncedTasks.length,
      hardDeletedCount: hardDeletedTasks.length,
      syncedTasks,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error During Sync", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  } finally {
    client.release();
  }
};

export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTaskById,
  deleteTasksByDate,
  syncTasks,
};
