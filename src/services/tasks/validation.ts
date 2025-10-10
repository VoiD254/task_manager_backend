import { z } from "zod";

const CreateTaskSchema = z.object({
  title: z.string().max(60, "Title cannot exceed 60 characters"),
  task_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use (yyyy-mm-dd)"),
  task_time: z
    .string()
    .regex(/^\d{1,2}:\d{2} (AM|PM)$/, "Invalid time format, use (hh:mm AM/PM)"),
  task_description: z
    .string()
    .max(200, "Description cannot exceed 200 characters")
    .optional(),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

const GetTasksSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use yyyy-mm-dd")
    .optional(),
});

type GetTasksInput = z.infer<typeof GetTasksSchema>;

const TaskByIdSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
});

type TaskByIdInput = z.infer<typeof TaskByIdSchema>;

const UpdateTaskSchema = z.object({
  title: z.string().max(60).optional(),
  task_description: z.string().max(200).optional(),
  task_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  task_time: z
    .string()
    .regex(/^\d{1,2}:\d{2} (AM|PM)$/)
    .optional(),
  notes: z.string().max(200).optional(),
  is_completed: z.boolean().optional(),
  is_marked_for_deletion: z.boolean().optional(),
});

type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

const DeleteTasksByDateSchema = z.object({
  task_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use yyyy-mm-dd"),
});

type DeleteTasksByDateInput = z.infer<typeof DeleteTasksByDateSchema>;

const TasksSyncSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string(),
  task_description: z.string().nullable().optional(),
  task_date_time: z.string(),
  notes: z.string().nullable().optional(),
  is_completed: z.boolean().default(false),
  is_synced: z.boolean().default(false),
  is_marked_for_deletion: z.boolean().default(false),
  updated_at: z.coerce.date(),
  created_at: z.coerce.date(),
});

const SyncTasksSchema = z.object({
  tasks: z.array(TasksSyncSchema),
});

type SyncTasksInput = z.infer<typeof SyncTasksSchema>;

export {
  CreateTaskSchema,
  CreateTaskInput,
  GetTasksSchema,
  GetTasksInput,
  TaskByIdSchema,
  TaskByIdInput,
  UpdateTaskSchema,
  UpdateTaskInput,
  DeleteTasksByDateSchema,
  DeleteTasksByDateInput,
  SyncTasksSchema,
  SyncTasksInput,
};
