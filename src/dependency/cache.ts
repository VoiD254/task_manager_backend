import type Redis from "ioredis";
import { getDependencies } from ".";

const DEFAULT_TTL = 600; // 10 mins

type CacheType = {
  set: (key: string, value: any, ttl?: number) => Promise<void>;
  get: <T = any>(key: string) => Promise<T | null>;
  del: (key: string | string[]) => Promise<number>;
};

const CACHE: CacheType = {
  set: async (key, value, ttl = DEFAULT_TTL): Promise<void> => {
    const redisClient: Redis = getDependencies().redisClient;

    if (!redisClient) {
      console.warn("Redis channel not initialized, skipping cache set");
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await redisClient.set(key, serialized, "EX", ttl);
    } catch (err) {
      console.error("Redis set error:", err);
    }
  },
  get: async <T = any>(key: string): Promise<T | null> => {
    const redisClient: Redis = getDependencies().redisClient;

    if (!redisClient) {
      return null;
    }

    try {
      const data = await redisClient.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (err) {
      console.error("Redis get error:", err);
      return null;
    }
  },
  del: async (key: string | string[]): Promise<number> => {
    const redisClient: Redis = getDependencies().redisClient;

    if (!redisClient) {
      return 0;
    }

    try {
      const reply = Array.isArray(key)
        ? await redisClient.del(...key)
        : await redisClient.del(key);

      return reply;
    } catch (err) {
      console.error("Redis delete error:", err);
      return 0;
    }
  },
};

export { CACHE };
