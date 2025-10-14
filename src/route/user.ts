import { Router } from "express";
import {
  forgotPassword,
  getProfile,
  refresh,
  resendOtp,
  resetPassword,
  signin,
  signup,
  updateProfile,
  verifyOtp,
} from "../services/user/index";
import { authenticate } from "../dependency/middleware/auth/auth";
import { rateLimitApi } from "../dependency/middleware/rate-limit-middleware/apiRateLimit";

const router = Router();

router.post("/signup", rateLimitApi({ maxRequests: 10 }), signup);
router.post("/signin", rateLimitApi({ maxRequests: 10 }), signin);
router.get(
  "/getProfile",
  authenticate,
  rateLimitApi({ maxRequests: 30 }),
  getProfile,
);
router.patch(
  "/updateProfile",
  authenticate,
  rateLimitApi({ maxRequests: 30 }),
  updateProfile,
);
router.post("/refreshToken", rateLimitApi({ maxRequests: 10 }), refresh);
router.post(
  "/forgotPassword",
  rateLimitApi({ maxRequests: 5, windowSeconds: 300 }),
  forgotPassword,
);
router.post(
  "/resendOtp",
  rateLimitApi({ maxRequests: 5, windowSeconds: 300 }),
  resendOtp,
);
router.post(
  "/verifyOtp",
  rateLimitApi({ maxRequests: 10, windowSeconds: 300 }),
  verifyOtp,
);
router.patch(
  "/resetPassword",
  rateLimitApi({ maxRequests: 10, windowSeconds: 300 }),
  resetPassword,
);

export default router;
