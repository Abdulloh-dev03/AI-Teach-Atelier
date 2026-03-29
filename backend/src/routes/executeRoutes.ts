import { executeCode } from "#src/controllers/execute.controller.js";
import { Router } from "express";
import rateLimit from "express-rate-limit";

const executeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: "Too many execution requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/run", executeLimiter, executeCode);

export default router;