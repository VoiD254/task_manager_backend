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

  if (process.env.NODE_ENV !== "production") {
    if (!(global as any)._redis) {
      (global as any)._redis = new Redis(configuration.REDIS_URI);

      (global as any)._redis.on("connect", () =>
        console.log("Connected to Redis (dev hot reload)"),
      );

      (global as any)._redis.on("error", (err: any) =>
        console.error("Redis connection error (dev):", err),
      );
    }

    redis = (global as any)._redis;
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
