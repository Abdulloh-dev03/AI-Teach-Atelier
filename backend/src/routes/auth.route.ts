import { Router } from "express";
import {
  signup,
  signin,
  signout,
  profile,
} from "#src/controllers/auth.controller.js";
import { auth } from "#src/middleware/auth.middleware.js";

const router = Router();

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.post("/sign-out", signout);
router.get("/profile", auth, profile);

export default router;
