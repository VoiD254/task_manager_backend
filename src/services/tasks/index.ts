import { Request, Response } from "express";
import { CreateTask } from "./interface";
import { createTaskDao } from "./dao";
import { CreateTaskInput, CreateTaskSchema } from "./validation";

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

    if (!user_id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const parsedResult = CreateTaskSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res.status(400).json({
        message: "Validation Error",
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

export { createTask };
