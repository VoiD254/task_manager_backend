import { Router } from "express";
import { getProfile, signin, signup } from "../services/user/index";
import { authenticate } from "../dependency/middleware/auth/auth";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/getProfile", authenticate, getProfile);

export default router;
