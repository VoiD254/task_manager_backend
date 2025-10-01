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

export { CreateTaskSchema, CreateTaskInput };
