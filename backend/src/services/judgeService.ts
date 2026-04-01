import { executionRouter } from "#services/executionRouter.js";
import { isSupportedLanguage } from "#config/languages.js";
import { WrapperService } from "#services/WrapperService.js";
import logger from "#config/logger.js";
import type {
  JudgeRequest,
  SubmissionResult,
  SupportedLanguage,
  TestCaseResult,
  Verdict,
} from "#types/judge.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Max parallel Docker containers running at the same time */
const CONCURRENCY_LIMIT = 3;

// ─── Simple semaphore ─────────────────────────────────────────────────────────

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

const executionSemaphore = new Semaphore(CONCURRENCY_LIMIT);

// ─── Verdict classifier ───────────────────────────────────────────────────────

/**
 * Maps raw Docker execution output → a structured Verdict.
 * Priority: COMPILATION_ERROR > RUNTIME_ERROR > TLE > OUTPUT_LIMIT_EXCEEDED > WA > ACCEPTED
 */
function classifyVerdict(
  stdout: string,
  expected: string,
  exitCode: number | null,
  timedOut: boolean,
  outputTruncated: boolean,
  stderr: string,
): Verdict {
  if (timedOut) return "TIME_LIMIT_EXCEEDED";
  if (outputTruncated) return "OUTPUT_LIMIT_EXCEEDED";

  // Non-zero exit with stderr usually means compile error (for compiled langs)
  // or a runtime exception
  if (exitCode !== 0 && stderr) {
    const s = stderr.toLowerCase();
    if (
      s.includes("compileerror") ||
      s.includes("syntaxerror") ||
      s.includes("error:") ||
      s.includes('exception in thread "main"')
    ) {
      return "COMPILATION_ERROR";
    }
    return "RUNTIME_ERROR";
  }

  if (exitCode !== 0) return "RUNTIME_ERROR";

  // Normalize line endings and trailing whitespace before comparing
  const normalize = (s: string) =>
    s
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .trimEnd();

  if (normalize(stdout) === normalize(expected)) return "ACCEPTED";
  return "WRONG_ANSWER";
}

// ─── Aggregate verdict ────────────────────────────────────────────────────────

const VERDICT_PRIORITY: Verdict[] = [
  "INTERNAL_ERROR",
  "COMPILATION_ERROR",
  "RUNTIME_ERROR",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "OUTPUT_LIMIT_EXCEEDED",
  "WRONG_ANSWER",
  "ACCEPTED",
];

function aggregateVerdict(verdicts: Verdict[]): Verdict {
  // Return the highest-priority (lowest index) verdict seen
  for (const v of VERDICT_PRIORITY) {
    if (verdicts.includes(v)) return v;
  }
  return "ACCEPTED";
}

// ─── Main judge function ──────────────────────────────────────────────────────

/**
 * judge() runs ALL test cases for a submission (in parallel, up to CONCURRENCY_LIMIT)
 * and returns an aggregated SubmissionResult.
 */
export const judge = async (req: JudgeRequest): Promise<SubmissionResult> => {
  const { code, language, testCases, limits = {} } = req;
  const {
    timeoutMs = 5_000,
    memoryMb = 128,
    maxOutputBytes = 1_048_576,
  } = limits;

  if (!isSupportedLanguage(language)) {
    return {
      verdict: "INTERNAL_ERROR",
      passed: 0,
      total: testCases.length,
      runtimeMs: 0,
      testResults: [],
    };
  }

  const overallStart = Date.now();

  // ── Run all test cases with bounded concurrency ───────────────────────────
  const wrappedCode = WrapperService.wrapCode(
    code,
    language as SupportedLanguage,
  );

  const testResultPromises = testCases.map(
    (tc, index) => async (): Promise<TestCaseResult> => {
      await executionSemaphore.acquire();
      try {
        const raw = await executionRouter(
          wrappedCode,
          tc.input,
          language,
          timeoutMs,
          memoryMb,
          maxOutputBytes,
        );

        const verdict = classifyVerdict(
          raw.stdout,
          tc.expected,
          raw.exitCode,
          raw.timedOut,
          raw.outputTruncated,
          raw.stderr,
        );

        return {
          index,
          verdict,
          stdout: tc.isHidden ? null : raw.stdout,
          stderr: raw.stderr || null,
          expected: tc.isHidden ? null : tc.expected,
          input: tc.isHidden ? null : tc.input,
          isHidden: tc.isHidden ?? false,
          executionTimeMs: raw.executionTimeMs,
          timedOut: raw.timedOut,
        };
      } finally {
        executionSemaphore.release();
      }
    },
  );

  // Execute all tasks (each waits for the semaphore)
  const testResults = await Promise.all(testResultPromises.map((fn) => fn()));

  const passed = testResults.filter((r) => r.verdict === "ACCEPTED").length;
  const verdict = aggregateVerdict(testResults.map((r) => r.verdict));
  const runtimeMs = Date.now() - overallStart;

  logger.info(
    `[judge] lang=${language} verdict=${verdict} passed=${passed}/${testCases.length} runtime=${runtimeMs}ms`,
  );

  return {
    verdict,
    passed,
    total: testCases.length,
    runtimeMs,
    testResults,
  };
};
