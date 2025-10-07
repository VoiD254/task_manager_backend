import pool from "../../dependency/pg";
import { CreateUserInput, UserProfile } from "./interface";

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

async function getProfileDao(user_id: string): Promise<UserProfile | null> {
  const query = `
    SELECT name, email
    FROM users
    WHERE user_id = $1
    LIMIT 1
  `;

  const values = [user_id];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
}

export { createUser, findUserByEmail, getProfileDao };
