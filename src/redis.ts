import Redis from "ioredis";
import configuration from "../configuration";

let redis: Redis | null = null;

function connectRedis() {
  if (!configuration.REDIS_URI) {
    throw new Error("REDIS_URI is not set in environment variables");
  }

  const uri = configuration.REDIS_URI;
  const usesTLS = uri.startsWith("rediss://");

  const redisOptions = usesTLS
    ? { tls: { rejectUnauthorized: false } as any }
    : {};

  const isDev = configuration.NODE_ENV !== "production";

  if (isDev) {
    if (!(global as any)._redis) {
      (global as any)._redis = new Redis(uri, redisOptions);
      (global as any)._redis.on("connect", () =>
        console.log("Connected to Redis (development)"),
      );
      (global as any)._redis.on("error", (err: any) =>
        console.error("Redis connection error (dev):", err),
      );
    }
    redis = (global as any)._redis;
    return redis;
  }

  if (!redis) {
    redis = new Redis(uri, redisOptions);
    redis.on("connect", () => console.log("Connected to Redis (production)"));
    redis.on("error", (err) => console.error("Redis connection error (prod):", err));
  }

  return redis;
}

export { connectRedis };
export default connectRedis();
