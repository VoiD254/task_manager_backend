import Redis from "ioredis";
import pool from "./pg";
import { Pool } from "pg";
import { connectRedis } from "../redis";

interface Dependencies {
  pgPool: Pool;
  redisClient: Redis;
}

const data = {} as Partial<Dependencies>;
let initialized = false;

export async function initDependencies() {
  if (initialized) return;

  data.pgPool = pool;
  console.log("PostgreSQL connection pool initialized");

  try {
    await data.pgPool.query("SELECT 1");
    console.log("Postgres connection verified");
  } catch (err) {
    console.error("Failed to verify Postgres connection:", err);
    throw err;
  }

  data.redisClient = connectRedis() as Redis;
  console.log("Redis client created");

  try {
    await data.redisClient.ping();
    console.log("Redis client connected successfully");
  } catch (err) {
    console.error("Failed to confirm Redis connection:", err);
    throw err;
  }

  initialized = true;
}

export function getDependencies(): Dependencies {
  if (!initialized || !data.pgPool || !data.redisClient) {
    throw new Error("Dependencies not initialized. Call initDependencies() first.");
  }
  return data as Dependencies;
}

export async function initializeAppEnvironment() {
  await initDependencies();
  return {
    close: closeAppEnvironment,
  };
}

export async function closeAppEnvironment() {
  if (data.redisClient) {
    try {
      await data.redisClient.quit();
      console.log("Redis client closed");
    } catch (err) {
      console.warn("Error closing Redis client:", err);
      try {
        await data.redisClient.disconnect();
      } catch {}
    }
    data.redisClient = undefined as any;
  }

  if (data.pgPool) {
    try {
      await data.pgPool.end();
      console.log("Postgres pool closed");
    } catch (err) {
      console.warn("Error closing Postgres pool:", err);
    }
    data.pgPool = undefined as any;
  }

  initialized = false;
}
