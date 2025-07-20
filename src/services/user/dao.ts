import bcrypt from "bcrypt";
import pool from "../../dependency/pg";

async function createUser(name: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name, email, password],
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
