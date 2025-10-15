import Redis from "ioredis";
import pool from "./pg";
import { Pool } from "pg";
import { connectRedis } from "../redis";

interface Dependencies {
  pgPool: Pool;
  redisClient: Redis;
}

const data = {} as Dependencies;

export async function initDependencies() {
  data.pgPool = pool;
  console.log("PostgreSQL connection pool initialized");

  data.redisClient = connectRedis() as Redis;
  console.log("Redis initialized");

  try {
    await data.redisClient.ping();
    console.log("Redis client connected successfully");
  } catch (err) {
    console.error("Failed to confirm Redis connection:", err);
    throw err;
  }
}

export function getDependencies() {
  return data;
}

export async function initializeAppEnvironment() {
  await initDependencies();
  // Add any other global setup here
}
