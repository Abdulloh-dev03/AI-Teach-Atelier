import { prisma } from "#lib/prisma.js";
import type { Request, Response } from "express";



// ─── GET /api/submissions/:id ─────────────────────────────────────────────────

/**
 * Fetch details of a single submission (own submissions only).
 */
export const getSubmission = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId: string = (req as any).user?.id;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      problem: {
        select: { id: true, title: true, slug: true, difficulty: true },
      },
      aiFeedback: true,
    },
  });

  if (!submission)
    return res.status(404).json({ error: "Submission not found" });
  if (submission.userId !== userId)
    return res.status(403).json({ error: "Forbidden" });

  return res.json(submission);
};

// ─── GET /api/submissions ─────────────────────────────────────────────────────

/**
 * List the authenticated user's submissions (paginated, newest first).
 */
export const listSubmissions = async (req: Request, res: Response) => {
  const userId: string = (req as any).user?.id;
  const problemId = req.query.problemId as string | undefined;

  const pageStr = Array.isArray(req.query.page)
    ? String(req.query.page[0])
    : String(req.query.page ?? "1");
  const limitStr = Array.isArray(req.query.limit)
    ? String(req.query.limit[0])
    : String(req.query.limit ?? "10");
  
  const page = Math.max(1, parseInt(pageStr, 10));
  const limit = Math.min(50, Math.max(1, parseInt(limitStr, 10)));
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (problemId) {
    where.problemId = problemId;
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        language: true,
        passed: true,
        total: true,
        runtime: true,
        createdAt: true,
        problem: {
          select: { id: true, title: true, slug: true, difficulty: true },
        },
      },
    }),
    prisma.submission.count({ where: { userId } }),
  ]);

  return res.json({
    data: submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};
