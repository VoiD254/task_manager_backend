import pool from "../../dependency/pg";
import { CreateUserInput } from "./interface";

async function createUser(data: CreateUserInput) {
  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id, name, email",
    [data.name, data.email, data.password],
  );

  return result.rows[0];
}

async function findUserByEmail(email: string) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email],
  );

  return result.rows[0];
}

export { createUser, findUserByEmail };
