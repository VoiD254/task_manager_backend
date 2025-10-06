import Redis from "ioredis";
import configuration from "../configuration";

let redis: Redis | null = null;

function connectRedis() {
  if (!configuration.REDIS_URI) {
    throw new Error("REDIS_URI is not set in environment variables");
  }

  if (redis) {
    return redis;
  }

  redis = new Redis(configuration.REDIS_URI);

  redis.on("connect", () => {
    console.log("Connected to Redis");
  });

  redis.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  return redis;
}

export { connectRedis };
