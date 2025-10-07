import { Router } from "express";
import {
  getProfile,
  signin,
  signup,
  updateProfile,
} from "../services/user/index";
import { authenticate } from "../dependency/middleware/auth/auth";
import { rateLimitApi } from "../dependency/middleware/apiRateLimit";

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

export default router;
