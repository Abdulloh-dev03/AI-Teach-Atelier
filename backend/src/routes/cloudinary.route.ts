import { Router } from "express";
import { getSignature } from "#src/controllers/cloudinary.controller.js";

const router = Router();

router.get("/signature", getSignature);

export default router;