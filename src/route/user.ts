import { Router } from "express";
import { signin, signup } from "../services/user/index";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);

export default router;
