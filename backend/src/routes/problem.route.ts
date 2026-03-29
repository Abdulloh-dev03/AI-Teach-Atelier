import { Router } from 'express';
import { auth } from '#src/middleware/auth.middleware.js';
import {
  generateProblem,
  getMyProblems,
  getProblem,
  submitProblem,
  deleteProblem,
} from '#src/controllers/problem.controller.js';
import rateLimit from 'express-rate-limit';

// Separate limiter for AI generation — it's expensive
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // max 5 generation requests per minute per IP
  message: { error: 'Too many generation requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// All problem routes require authentication
router.use(auth);

router.post('/generate', generateLimiter, generateProblem);
router.get('/my', getMyProblems);
router.get('/:id', getProblem);
router.post('/:id/submit', submitProblem);
router.delete('/:id', deleteProblem);
export default router;