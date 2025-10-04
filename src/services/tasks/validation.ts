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

const GetTaskByIdSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
});

type GetTaskByIdInput = z.infer<typeof GetTaskByIdSchema>;

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
  is_synced: z.boolean().optional(),
});

type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export {
  CreateTaskSchema,
  CreateTaskInput,
  GetTasksSchema,
  GetTasksInput,
  GetTaskByIdSchema,
  GetTaskByIdInput,
  UpdateTaskSchema,
  UpdateTaskInput,
};
