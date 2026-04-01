import { prisma } from "#src/lib/prisma.js";
import { generateProblemFromAI } from "#src/services/ai.service.js";
import logger from "#src/config/logger.js";
import type { Difficulty } from "@prisma/client";
import { judge } from "#src/services/judgeService.js";
const DAILY_LIMIT = 10;

// ─── Daily limit check ────────────────────────────────────────────────────────

export const getDailyGenerationCount = async (
  userId: string,
): Promise<number> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return prisma.problem.count({
    where: {
      requestedById: userId,
      createdAt: { gte: startOfDay },
    },
  });
};

export const hasReachedDailyLimit = async (
  userId: string,
): Promise<boolean> => {
  const count = await getDailyGenerationCount(userId);
  return count >= DAILY_LIMIT;
};

// ─── Generate and save ────────────────────────────────────────────────────────

export const generateAndSaveProblem = async (
  userId: string,
  language: string,
  difficulty: Difficulty,
) => {
  // Enforce daily limit before calling the AI
  if (await hasReachedDailyLimit(userId)) {
    throw new Error("DAILY_LIMIT_REACHED");
  }

  const generated = await generateProblemFromAI({ language, difficulty });

  // Slug must be unique — append a short random suffix to avoid collisions
  const uniqueSlug = `${generated.slug}-${Date.now().toString(36)}`;

  const problem = await prisma.problem.create({
    data: {
      title: generated.title,
      slug: uniqueSlug,
      description: generated.description,
      difficulty,
      language,
      requestedById: userId,
      testCases: {
        create: generated.testCases.map((tc) => ({
          input: tc.input,
          expected: tc.expected,
          isHidden: tc.isHidden,
        })),
      },
    },
    include: {
      // Only return visible test cases to the caller
      testCases: {
        where: { isHidden: false },
      },
    },
  });

  logger.info(`Problem generated and saved: ${problem.id} for user ${userId}`);
  return problem;
};

// ─── Fetch a single problem (no hidden test cases) ────────────────────────────

export const getProblemById = async (problemId: string, userId: string) => {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        where: { isHidden: false }, // hidden test cases never leave the server
      },
    },
  });

  if (!problem) throw new Error("PROBLEM_NOT_FOUND");

  // Users can only view their own generated problems
  if (problem.requestedById !== userId) throw new Error("FORBIDDEN");

  return problem;
};

// ─── List user's generated problems ──────────────────────────────────────────

export const getUserProblems = async (userId: string) => {
  return prisma.problem.findMany({
    where: { requestedById: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      language: true,
      createdAt: true,
      // Include submission count so the frontend can show solved/unsolved
      submissions: {
        where: { userId },
        select: { status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
};

// ─── Submit solution ──────────────────────────────────────────────────────────


export const submitSolution = async (
  problemId: string,
  userId: string,
  code: string,
  language: string,
) => {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: true },
  });

  if (!problem) throw new Error("PROBLEM_NOT_FOUND");
  if (problem.requestedById !== userId) throw new Error("FORBIDDEN");

  // Use the high-level judge service instead of runCode directly
  const judgeResult = await judge({
    code,
    language: language as any,
    testCases: problem.testCases,
  });

  // Map the judge results for the frontend — following PascalCase naming for statuses
  const results = judgeResult.testResults.map((tr) => ({
    input: tr.isHidden ? null : tr.input,
    expected: tr.isHidden ? null : tr.expected,
    received: tr.timedOut ? "Timed out" : tr.stdout,
    stderr: tr.stderr,
    isHidden: tr.isHidden,
    status:
      tr.verdict === "ACCEPTED"
        ? "Passed"
        : tr.verdict
            .replace(/_/g, " ")
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" "),
  }));

  // Persist the submission
  const submission = await prisma.submission.create({
    data: {
      code,
      language,
      status: judgeResult.verdict,
      passed: judgeResult.passed,
      total: judgeResult.total,
      runtime: judgeResult.runtimeMs,
      results: results,
      userId,
      problemId,
    },
  });

  return {
    submissionId: submission.id,
    status: judgeResult.verdict,
    passed: judgeResult.passed,
    total: judgeResult.total,
    runtime: judgeResult.runtimeMs,
    results,
  };
};


