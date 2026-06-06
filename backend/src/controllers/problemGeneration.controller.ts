import type { Response, NextFunction } from "express";
import type { AuthRequest } from "#src/types/auth.js";
import { prisma } from "#src/lib/prisma.js";
import logger from "#src/config/logger.js";
import { generateAndSaveProblem } from "#src/services/problem.service.js";
import type { Difficulty } from "@prisma/client";

/**
 * POST /api/problem-generations
 * Starts an asynchronous problem generation job and returns the generation id immediately.
 */
export const startProblemGeneration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const { language, difficulty } = req.body as {
      language: string;
      difficulty: Difficulty;
    };

    // Create a new ProblemGeneration record with PENDING status
    const generation = await prisma.problemGeneration.create({
      data: {
        language,
        difficulty,
        status: "PENDING",
        requestedById: userId,
      },
    });

    // Respond immediately
    res.status(202).json({
      generationId: generation.id,
      status: generation.status,
    });

    // Fire‑and‑forget processing – do not await
    void processGeneration(generation.id, userId, language, difficulty);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.error("startProblemGeneration error", e);
    res.status(500).json({ error: "Internal server error: " + errMsg });
  }
};

/**
 * GET /api/problem-generations/:id
 * Returns the current status (and problemId / errorMessage when finished).
 */
export const getProblemGenerationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const generationId = req.params["id"] as string;
    const generation = await prisma.problemGeneration.findUnique({
      where: { id: generationId },
    });

    if (!generation) {
      return res.status(404).json({ error: "Generation not found" });
    }

    // Ensure the requesting user owns the generation
    if (generation.requestedById !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { status, problemId, errorMessage } = generation;
    const payload: any = { status };
    if (status === "COMPLETED" && problemId) payload.problemId = problemId;
    if (status === "FAILED" && errorMessage) payload.errorMessage = errorMessage;
    res.json(payload);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.error("getProblemGenerationStatus error", e);
    res.status(500).json({ error: "Internal server error: " + errMsg });
  }
};

/**
 * Internal helper that runs the heavy AI generation work.
 * It updates the ProblemGeneration record through the lifecycle.
 */
async function processGeneration(
  generationId: string,
  userId: string,
  language: string,
  difficulty: Difficulty,
) {
  try {
    // Mark as PROCESSING
    await prisma.problemGeneration.update({
      where: { id: generationId },
      data: { status: "PROCESSING" },
    });

    // Re‑use existing generateAndSaveProblem service (which enforces daily limits)
    const problem = await generateAndSaveProblem(userId, language, difficulty);

    // Link problem to generation and mark COMPLETED
    await prisma.problemGeneration.update({
      where: { id: generationId },
      data: {
        status: "COMPLETED",
        problemId: problem.id,
      },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.error("processGeneration error", e);
    // Mark as FAILED with error message
    await prisma.problemGeneration.update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        errorMessage: errMsg,
      },
    });
  }
}
