/**
 * Optional Redis-backed submission queue using BullMQ.
 *
 * When REDIS_URL is set in the environment, submissions are processed
 * asynchronously through a queue (enabling horizontal scaling with multiple
 * worker processes). When not set, the queue is disabled and submissions
 * are handled synchronously.
 *
 * To activate the queue, install BullMQ and set REDIS_URL:
 *   npm install bullmq
 *   REDIS_URL=redis://localhost:6379
 *
 * Usage (producer — in API handler):
 *   const jobId = await enqueueSubmission({ submissionId, code, language, testCases, limits });
 *
 * Usage (consumer — dedicated worker process src/worker.ts):
 *   import { createJudgeWorker } from '#services/submissionQueue.js';
 *   createJudgeWorker();
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueuedSubmissionData {
  submissionId: string;
  code: string;
  language: string;
  testCases: Array<{ input: string; expected: string; isHidden?: boolean }>;
  limits?: {
    timeoutMs?: number;
    memoryMb?: number;
    maxOutputBytes?: number;
  };
}

// ─── Availability check ───────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL;

export const isQueueEnabled = (): boolean => Boolean(REDIS_URL);

// ─── Producer ─────────────────────────────────────────────────────────────────

/**
 * Enqueue a submission for async processing.
 * Returns the BullMQ job ID if queued, or null if queue is disabled.
 * Requires: npm install bullmq
 */
export const enqueueSubmission = async (
  data: QueuedSubmissionData,
): Promise<string | null> => {
  if (!isQueueEnabled()) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bullmq: any = await import("bullmq").catch(() => {
    throw new Error("BullMQ not installed. Run: npm install bullmq");
  });

  const queue = new bullmq.Queue("judge", {
    connection: { url: REDIS_URL! },
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "fixed", delay: 2_000 },
      removeOnComplete: 500,
      removeOnFail: 200,
    },
  });

  const job = await queue.add("judge-submission", data, {
    jobId: data.submissionId, // idempotent — re-submitting same ID is a no-op
  });

  await queue.close();
  return String(job.id ?? "");
};

// ─── Consumer / Worker ────────────────────────────────────────────────────────

/**
 * Starts a BullMQ Worker that consumes judge jobs.
 * Call this in a dedicated worker process (src/worker.ts).
 * Requires: npm install bullmq
 */
export const createJudgeWorker = async () => {
  if (!isQueueEnabled()) {
    throw new Error("REDIS_URL is not set — queue is disabled");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bullmq: any = await import("bullmq").catch(() => {
    throw new Error("BullMQ not installed. Run: npm install bullmq");
  });

  const { judge } = await import("#services/judgeService.js");
  const { prisma } = await import("#lib/prisma.js");

  const statusMap: Record<string, string> = {
    ACCEPTED: "ACCEPTED",
    WRONG_ANSWER: "WRONG_ANSWER",
    TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
    RUNTIME_ERROR: "RUNTIME_ERROR",
    COMPILATION_ERROR: "RUNTIME_ERROR",
    OUTPUT_LIMIT_EXCEEDED: "RUNTIME_ERROR",
    MEMORY_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
    INTERNAL_ERROR: "RUNTIME_ERROR",
  };

  const worker = new bullmq.Worker(
    "judge",
    async (job: { data: QueuedSubmissionData }) => {
      const { submissionId, code, language, testCases, limits } = job.data;
      const result = await judge({ code, language, testCases, limits });

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: (statusMap[result.verdict] ?? "RUNTIME_ERROR") as any,
          passed: result.passed,
          total: result.total,
          runtime: result.runtimeMs,
        },
      });

      return result;
    },
    {
      connection: { url: REDIS_URL! },
      concurrency: 3,
    },
  );

  worker.on("completed", (job: { id: string }) => {
    console.log(`[queue] Job ${job.id} completed`);
  });

  worker.on("failed", (job: { id?: string } | undefined, err: Error) => {
    console.error(`[queue] Job ${job?.id} failed:`, err.message);
  });

  console.log("[queue] Judge worker started — waiting for jobs...");
  return worker;
};
