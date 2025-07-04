import pool from "./pg";
import { Pool } from "pg";

interface Dependencies {
  pgPool: Pool;
}

const data = {} as Dependencies;

export function initDependencies() {
  data.pgPool = pool;
  console.log("PostgreSQL connection pool initialized");
}

export function getDependencies() {
  return data;
}

export async function initializeAppEnvironment() {
  await initDependencies();
  // Add any other global setup here in the future
}
