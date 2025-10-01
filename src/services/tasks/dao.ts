import pool from "../../dependency/pg";
import { CreateTask } from "./interface";

const createTaskDao = async (task: CreateTask) => {
  const query = `
        INSERT INTO tasks (user_id, title, task_description, task_date_time, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING task_id, user_id, title, task_description, task_date_time, notes, is_completed, is_synced, is_marked_for_deletion, created_at, updated_at
    `;

  const values = [
    task.user_id,
    task.title,
    task.task_description || null,
    task.task_date_time,
    task.notes || null,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

export { createTaskDao };
