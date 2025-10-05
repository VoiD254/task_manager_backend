import pool from "../../dependency/pg";
import { CreateTask, UpdateTask } from "./interface";

const createTaskDao = async (task: CreateTask) => {
  const query = `
    INSERT INTO tasks (user_id, title, task_description, task_date_time, notes, is_synced)
    VALUES ($1, $2, $3, $4, $5, false)
    RETURNING *
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

const getTasksByUserId = async (user_id: string, date?: string) => {
  let query = `
    SELECT *
    FROM tasks
    WHERE user_id = $1
    AND is_marked_for_deletion = false
  `;

  const values = [user_id];

  if (date) {
    query += " AND DATE(task_date_time) = $2";
    values.push(date);
  }

  query += " ORDER BY task_date_time ASC";

  const result = await pool.query(query, values);

  return result.rows;
};

const getTaskById = async (user_id: string, task_id: string) => {
  const query = `
    SELECT *
    FROM tasks
    WHERE user_id = $1 AND task_id = $2
    LIMIT 1
  `;

  const values = [user_id, task_id];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const updateTaskDao = async (
  user_id: string,
  task_id: string,
  updates: Partial<UpdateTask>,
) => {
  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return null;
  }

  const setStrings = fields
    .map((field, i) => `${field} = $${i + 1}`)
    .join(", ");

  const values = fields.map((field) => updates[field as keyof UpdateTask]);

  values.push(user_id, task_id);

  const query = `
    UPDATE tasks
    SET ${setStrings}, updated_at = NOW(), is_synced = false
    WHERE user_id = $${values.length - 1} AND task_id = $${values.length}
    RETURNING *
  `;

  const result = await pool.query(query, values);

  return result.rows[0];
};

const softDeleteTaskById = async (user_id: string, task_id: string) => {
  const query = `
    UPDATE tasks
    SET is_marked_for_deletion = true, is_synced = false, updated_at = NOW()
    WHERE user_id = $1 AND task_id = $2
    RETURNING *
  `;

  const values = [user_id, task_id];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
};

const deleteTaskByIdDao = async (user_id: string, task_id: string) => {
  const query = `
    DELETE FROM tasks
    WHERE user_id = $1 AND task_id = $2
    RETURNING *
  `;

  const values = [user_id, task_id];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
};

const softDeleteTasksByDate = async (user_id: string, date: string) => {
  const query = `
    UPDATE tasks
    SET is_marked_for_deletion = true, is_synced = false, updated_at = NOW()
    WHERE user_id = $1 AND DATE(task_date_time) = $2
    RETURNING *
  `;

  const values = [user_id, date];

  const result = await pool.query(query, values);

  return result.rows;
};

const deleteTasksByDateDao = async (user_id: string, date: string) => {
  const query = `
    DELETE FROM tasks
    WHERE user_id = $1 AND DATE(task_date_time) = $2
    RETURNING *
  `;

  const values = [user_id, date];

  const result = await pool.query(query, values);

  return result.rows;
};

const markTaskAsSynced = async (user_id: string, task_id: string) => {
  const query = `
    UPDATE tasks
    SET is_synced = true
    WHERE user_id = $1 AND task_id = $2
    RETURNING *
  `;

  const values = [user_id, task_id];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
};

const markTasksAsSynced = async (user_id: string, task_ids: string[]) => {
  if (!task_ids.length) {
    return [];
  }

  const query = `
    UPDATE tasks
    SET is_synced = true
    WHERE user_id = $1 AND task_id = ANY($2::uuid[])
    RETURNING *
  `;

  const values = [user_id, task_ids];

  const result = await pool.query(query, values);

  return result.rows;
};

export {
  createTaskDao,
  getTasksByUserId,
  getTaskById,
  updateTaskDao,
  softDeleteTaskById,
  softDeleteTasksByDate,
  deleteTaskByIdDao,
  deleteTasksByDateDao,
  markTaskAsSynced,
  markTasksAsSynced,
};
