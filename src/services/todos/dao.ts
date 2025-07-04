import pool from "../../dependency/pg";
import { Todo } from "./interface";

export async function getAllTodos(): Promise<Todo[]> {
  const result = await pool.query("SELECT * FROM tasks ORDER BY id");
  return result.rows;
}

export async function insertTodo(title: string): Promise<Todo> {
  const result = await pool.query(
    "INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING *",
    [title, false],
  );
  return result.rows[0];
}
