import { CACHE } from "../../dependency/cache";
import pool from "../../dependency/pg";
import { CreateUserInput, UpdateProfileInput, UserProfile } from "./interface";

const PROFILE_TTL = 300; // 5 mins
const PROFILE_NAMESPACE = "taskmanager:user:profile";

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
  const cacheKey = `${PROFILE_NAMESPACE}:${user_id}`;

  try {
    const cached = await CACHE.get<UserProfile>(cacheKey);
    if (cached !== null) {
      // cache hit, can be profile or null for "not found"
      return cached;
    }
  } catch (err) {
    throw new Error("Error reading from cache");
  }

  const query = `
    SELECT name, email
    FROM users
    WHERE user_id = $1
    LIMIT 1
  `;

  const values = [user_id];

  const result = await pool.query(query, values);

  const profile = result.rows[0] || null;

  try {
    await CACHE.set(cacheKey, profile, PROFILE_TTL);
  } catch (err) {
    throw new Error("Error setting cache");
  }

  return profile;
}

async function updateProfileDao({ user_id, name }: UpdateProfileInput) {
  const query = `
    UPDATE users
    SET name = $1
    WHERE user_id = $2
    RETURNING user_id, name, email
  `;

  const values = [name, user_id];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
}

export {
  createUser,
  findUserByEmail,
  getProfileDao,
  updateProfileDao,
  PROFILE_NAMESPACE,
};
