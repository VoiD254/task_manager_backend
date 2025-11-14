import Redis from "ioredis";
import configuration from "../configuration";

let redis: Redis | null = null;

function connectRedis() {
  if (!configuration.REDIS_URI) {
    throw new Error("REDIS_URI is not set in environment variables");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const needsTLS =
    configuration.REDIS_URI.startsWith("rediss://") || isProduction;

  const redisOptions = needsTLS
    ? {
        tls: {
          rejectUnauthorized: false, // Required for many managed Redis providers
        },
      }
    : {};

  // ---------- DEVELOPMENT (HOT RELOAD SAFE) ----------
  if (!isProduction) {
    if (!(global as any)._redis) {
      (global as any)._redis = new Redis(configuration.REDIS_URI, redisOptions);

      (global as any)._redis.on("connect", () =>
        console.log("Connected to Redis (development)")
      );

      (global as any)._redis.on("error", (err: any) =>
        console.error("Redis connection error (dev):", err)
      );
    }

    redis = (global as any)._redis;
    return redis;
  }

  // ---------- PRODUCTION ----------
  redis = new Redis(configuration.REDIS_URI, redisOptions);

  redis.on("connect", () => {
    console.log("Connected to Redis (production)");
  });

  redis.on("error", (err) => {
    console.error("Redis connection error (prod):", err);
  });

  return redis;
}

export { connectRedis };
