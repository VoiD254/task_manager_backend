import { PoolClient } from "pg";
import pool from "../../dependency/pg";
import { CreateTask, CreateTaskForSync, UpdateTask } from "./interface";

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

const createTaskDaoForSync = async (
  task: CreateTaskForSync,
  client: PoolClient | typeof pool = pool,
) => {
  const query = `
    INSERT INTO tasks (user_id, task_id, title, task_description, task_date_time, notes, is_completed, is_synced, is_marked_for_deletion, created_at, updated_at, synced_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, $8, $9, NULL)
    RETURNING *
  `;

  const values = [
    task.user_id,
    task.task_id || null,
    task.title,
    task.task_description || null,
    task.task_date_time,
    task.notes || null,
    task.is_completed ?? false,
    task.created_at || new Date(),
    task.updated_at || new Date(),
  ];

  const result = await client.query(query, values);

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

const getTaskById = async (
  user_id: string,
  task_id: string,
  client: PoolClient | typeof pool = pool,
) => {
  const query = `
    SELECT *
    FROM tasks
    WHERE user_id = $1 AND task_id = $2
    LIMIT 1
  `;

  const values = [user_id, task_id];

  const result = await client.query(query, values);

  return result.rows[0];
};

const updateTaskDao = async (
  user_id: string,
  task_id: string,
  updates: Partial<UpdateTask>,
  client: PoolClient | typeof pool = pool,
) => {
  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return null;
  }

  const setStrings = fields
    .map((field, i) => `${field} = $${i + 1}`)
    .join(", ");

  const values = fields.map((field) => updates[field as keyof UpdateTask]);

  const hasUpdatedAt = "updated_at" in updates;

  let updatedAtClause: string;
  if (hasUpdatedAt) {
    updatedAtClause = `updated_at = $${values.length + 1}`;
    values.push(updates.updated_at);
  } else {
    updatedAtClause = `updated_at = NOW()`;
  }

  values.push(user_id, task_id);

  const query = `
    UPDATE tasks
    SET ${setStrings}, ${updatedAtClause}, is_synced = false
    WHERE user_id = $${values.length - 1} AND task_id = $${values.length}
    RETURNING *
  `;

  const result = await client.query(query, values);

  return result.rows[0];
};

const softDeleteTaskById = async (
  user_id: string,
  task_id: string,
  client: PoolClient | typeof pool = pool,
) => {
  const query = `
    UPDATE tasks
    SET is_marked_for_deletion = true, is_synced = false, updated_at = NOW()
    WHERE user_id = $1 AND task_id = $2
    RETURNING *
  `;

  const values = [user_id, task_id];

  const result = await client.query(query, values);

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

const hardDeleteSoftDeletedTasks = async (
  user_id: string,
  client: PoolClient | typeof pool = pool,
) => {
  const query = `
    DELETE FROM tasks
    WHERE user_id = $1 AND is_marked_for_deletion = true
    RETURNING *
  `;

  const values = [user_id];

  const result = await client.query(query, values);

  return result.rows;
};

const markTasksAsSynced = async (
  user_id: string,
  task_ids: string[],
  client: PoolClient | typeof pool = pool,
) => {
  if (!task_ids.length) {
    return [];
  }

  const query = `
    UPDATE tasks
    SET is_synced = true, synced_at = NOW()
    WHERE user_id = $1 AND task_id = ANY($2::uuid[])
    RETURNING *
  `;

  const values = [user_id, task_ids];

  const result = await client.query(query, values);

  return result.rows;
};

export {
  createTaskDao,
  createTaskDaoForSync,
  getTasksByUserId,
  getTaskById,
  updateTaskDao,
  softDeleteTaskById,
  softDeleteTasksByDate,
  hardDeleteSoftDeletedTasks,
  markTasksAsSynced,
};
