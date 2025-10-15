import { NextFunction, Request, Response } from "express";
import {
  DEFAULT_API_LIMIT,
  RateLimiter,
  RateLimitError,
} from "../../redis-services/rate-limit";

const rateLimiter = new RateLimiter();

function rateLimitApi(options?: {
  maxRequests?: number;
  windowSeconds?: number;
}) {
  const maxRequests = options?.maxRequests || DEFAULT_API_LIMIT;
  const windowSeconds = options?.windowSeconds || 60;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rateLimiter.checkApiLimit(req, maxRequests, windowSeconds);

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

      console.error("API rate-limit error:", err);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  };
}

export { rateLimitApi };
