import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

type SMTPConfig = {
  HOST: string;
  PORT: number;
  USER?: string;
  PASS?: string;
  FROM?: string;
};

type Config = {
  NODE_ENV: string;
  HOST: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  REDIS_URI: string;
  PG_SSL: boolean;
  SMTP: SMTPConfig;
};

// determine env (default to local)
const env = process.env.NODE_ENV?.trim() || "local";

// Load dotenv from configs only when not in production AND file exists.
// This avoids accidentally reading a file in PaaS where env vars are provided by the platform.
const dotenvPath = path.resolve(__dirname, `./configs/.${env}.env`);
if (env !== "production" && fs.existsSync(dotenvPath)) {
  dotenv.config({ path: dotenvPath });
}

// Helper to parse integers safely
const parseIntOr = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const configuration: Config = {
  NODE_ENV: env,
  HOST: process.env.HOST || "0.0.0.0",
  PORT: parseIntOr(process.env.PORT, 3000),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  REDIS_URI: process.env.REDIS_URI || "",
  PG_SSL: process.env.PG_SSL === "true" || env === "production",
  SMTP: {
    HOST: process.env.SMTP_HOST || "",
    PORT: parseIntOr(process.env.SMTP_PORT, 465),
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
    FROM: process.env.SMTP_FROM,
  },
};

// Minimal validation - fail fast if critical vars are missing
const requiredInAllEnvs = ["DATABASE_URL", "JWT_SECRET", "REDIS_URI"];
const missing: string[] = [];

for (const key of requiredInAllEnvs) {
  if (!(configuration as any)[key]) missing.push(key);
}

if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      `Current NODE_ENV=${env}.`
  );
}

export default configuration;
