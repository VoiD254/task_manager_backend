import { Request, Response, NextFunction } from "express";
import { DEFAULT_TASKS_PER_DATE_LIMIT, RateLimitError } from "../../rate-limit";
import { rateLimiter } from "./apiRateLimit.js";

function taskRateLimit(limit: number = DEFAULT_TASKS_PER_DATE_LIMIT) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;
      const taskDate = req.body?.task_date;

      if (!userId || !taskDate) {
        return res.status(400).json({
          message: "Missing user ID or task date",
        });
      }

      await rateLimiter.checkTaskCreationLimit(
        userId,
        new Date(taskDate),
        limit,
      );
      next();
    } catch (err) {
      if (err instanceof RateLimitError) {
        return res.status(429).json({
          code: err.code,
          message: err.message,
          limit: err.limit,
          count: err.count,
        });
      }

      console.error("Task rate-limit middleware error:", err);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  };
}

export { taskRateLimit };
