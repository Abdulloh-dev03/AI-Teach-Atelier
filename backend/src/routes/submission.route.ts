import { Router } from "express";
import { auth } from "#middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
import {
  getSubmission,
  listSubmissions,
} from "#controllers/submission.controller.js";

// Limit: 10 submissions per minute per IP (prevents brute-forcing test cases)
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many submissions, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// All submission routes require authentication
router.use(auth);

// GET    /api/submissions          → list my submissions (paginated)
// GET    /api/submissions/:id      → get single submission details
router.get("/", listSubmissions);
router.get("/:id", getSubmission);

export default router;
