import type { Response, NextFunction } from "express";
import type { AuthRequest } from "#src/types/auth.js";
import { formValidationError } from "#src/utils/format.js";
import {
  generateProblemSchema,
  submitSolutionSchema,
} from "#src/validations/problem.validation.js";
import {
  generateAndSaveProblem,
  getProblemById,
  getUserProblems,
  submitSolution,
  getDailyGenerationCount,
} from "#src/services/problem.service.js";
import logger from "#src/config/logger.js";
import type { Difficulty } from "@prisma/client";
import { prisma } from "#src/lib/prisma.js";

// POST /api/problems/generate
export const generateProblem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const validation = generateProblemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formValidationError(validation.error),
      });
    }

    const { language, difficulty } = validation.data;

    const problem = await generateAndSaveProblem(
      userId,
      language,
      difficulty as Difficulty,
    );

    // Include remaining quota in the response so the frontend can show it
    const usedToday = await getDailyGenerationCount(userId);

    return res.status(201).json({
      message: "Problem generated",
      remainingToday: 10 - usedToday,
      problem,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "DAILY_LIMIT_REACHED") {
      return res.status(429).json({
        error: "Daily generation limit reached (10/day). Come back tomorrow!",
      });
    }
    if (e instanceof Error && e.message === "AI returned invalid JSON") {
      return res.status(502).json({
        error: "AI provider returned an unexpected response. Please try again.",
      });
    }
    if (e instanceof Error && e.message === "Generated test cases failed validation") {
      return res.status(502).json({
        error: "AI failed to generate a valid problem. This usually happens when the requirements are too complex. Please try again or slightly change your prompt.",
      });
    }
    logger.error("generateProblem error", e);
    next(e);
  }
};

// GET /api/problems/my
export const getMyProblems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const problems = await getUserProblems(req.user!.id);
    return res.json(problems);
  } catch (e) {
    logger.error("getMyProblems error", e);
    next(e);
  }
};

// GET /api/problems/:id
export const getProblem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const problem = await getProblemById(
      req.params["id"] as string,
      req.user!.id,
    );
    return res.json(problem);
  } catch (e) {
    if (e instanceof Error && e.message === "PROBLEM_NOT_FOUND") {
      return res.status(404).json({ error: "Problem not found" });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Access denied" });
    }
    logger.error("getProblem error", e);
    next(e);
  }
};

// POST /api/problems/:id/submit
export const submitProblem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const problemId = req.params["id"] as string;

    const validation = submitSolutionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formValidationError(validation.error),
      });
    }

    const { code, language } = validation.data;

    const result = await submitSolution(problemId, userId, code, language);

    return res.status(201).json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "PROBLEM_NOT_FOUND") {
      return res.status(404).json({ error: "Problem not found" });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Access denied" });
    }
    logger.error("submitProblem error", e);
    next(e);
  }
};

export const deleteProblem = async (
  req:AuthRequest,
  res:Response,
  next:NextFunction
) => {
  try {
    const problem = await prisma.problem.findUnique({
      where:{id:req.params['id'] as string}
    })
    if(!problem){
      return res.status(404).json({error:'Problem not found'})
    }
    if(problem.requestedById !== req.user!.id){
      return res.status(403).json({error:'Access denied'})
    }
    await prisma.problem.delete({
      where:{id:req.params['id'] as string}
    })
    return res.status(200).json({message:'Problem deleted successfully'})
  } catch (error) {
    logger.error("deleteProblem error", error);
    next(error);
  }
};

export const deleteAllProblems = async (
  req:AuthRequest,
  res:Response,
  next:NextFunction
) => {
  try {
    const userId = req.user!.id;
    await prisma.problem.deleteMany({
      where:{requestedById:userId}
    })
    return res.status(200).json({message:'All problems deleted successfully'})
  } catch (error) {
    logger.error("deleteAllProblems error", error);
    next(error);
  }
}