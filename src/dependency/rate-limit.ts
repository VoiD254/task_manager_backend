import dayjs from "dayjs";
import { getDependencies } from ".";
import { Request } from "express";

const DEFAULT_API_LIMIT = 60;
const DEFAULT_TASKS_PER_DATE_LIMIT = 50; // 50 tasks per user per date
const RATE_NAMESPACE = "taskmanager:rate";
const TTL_BUFFER_SECONDS = 5;

class RateLimitError extends Error {
  code = "LIMIT_EXCEEDED";
  limit: number;
  count: number;
  key: string;

  constructor(limit: number, count: number, key: string) {
    super(`Rate limit exceeded for ${key}`);
    this.limit = limit;
    this.count = count;
    this.key = key;
  }
}

class RateLimiter {
  private redis = getDependencies().redisClient;

  private async incrementCounter(
    key: string,
    ttlSeconds: number,
  ): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    const value = await this.redis.incr(key);
    if (value === 1) {
      await this.redis.expire(key, ttlSeconds + TTL_BUFFER_SECONDS);
    }

    return value;
  }

  private getKey(prefix: string, id: string, windowSeconds: number): string {
    const window = Math.floor(Date.now() / (windowSeconds * 1000));

    return `${RATE_NAMESPACE}:${prefix}:${id}${window}`;
  }

  private getTaskKey(userId: string, taskDate: Date): string {
    const dateKey = dayjs(taskDate).format("YYYY-MM-DD");

    return `${RATE_NAMESPACE}:tasks:${userId}:${dateKey}`;
  }

  async checkApiLimit(
    req: Request,
    maxRequests: number = DEFAULT_API_LIMIT,
    windowSeconds: number = 60,
  ): Promise<void> {
    let id = req.user?.user_id;
    if (!id) {
      const ip =
        req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";
      id = ip
        .split(",")[0]
        .trim()
        .replace(/^::ffff:/, "");
    }

    const key = this.getKey("api", id, windowSeconds);
    const count = await this.incrementCounter(key, windowSeconds);

    if (count > maxRequests) {
      throw new RateLimitError(maxRequests, count, key);
    }
  }

  async checkTaskCreationLimit(
    userId: string,
    taskDate: Date,
    limit: number = DEFAULT_TASKS_PER_DATE_LIMIT,
  ): Promise<void> {
    const key = this.getTaskKey(userId, taskDate);
    const count = await this.incrementCounter(key, 24 * 60 * 60);

    if (count > limit) {
      throw new RateLimitError(limit, count, key);
    }
  }
}

export {
  DEFAULT_API_LIMIT,
  DEFAULT_TASKS_PER_DATE_LIMIT,
  RateLimiter,
  RateLimitError,
};
