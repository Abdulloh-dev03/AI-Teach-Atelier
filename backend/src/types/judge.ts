// ─── Judge System — Shared Types ─────────────────────────────────────────────

export type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "c"
  | "cpp"
  | "go";

// ─── Input / Config ───────────────────────────────────────────────────────────

export interface TestCaseInput {
  input: string;
  expected: string;
  /** Whether to hide this test case's I/O from the client response */
  isHidden?: boolean;
}

export interface ExecutionLimits {
  /** Timeout in milliseconds (default: 5000) */
  timeoutMs?: number;
  /** Memory limit passed to Docker in MB (default: 128) */
  memoryMb?: number;
  /** Max output bytes captured from stdout (default: 1_048_576 = 1 MB) */
  maxOutputBytes?: number;
}

export interface JudgeRequest {
  code: string;
  language: SupportedLanguage | string;
  testCases: TestCaseInput[];
  limits?: ExecutionLimits;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export type Verdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "MEMORY_LIMIT_EXCEEDED"
  | "OUTPUT_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export interface TestCaseResult {
  /** Sequential index of this test case */
  index: number;
  verdict: Verdict;
  /** Actual stdout output (null for hidden cases) */
  stdout: string | null;
  /** Stderr output */
  stderr: string | null;
  /** Expected output (null for hidden cases) */
  expected: string | null;
  /** Raw input (null for hidden cases) */
  input: string | null;
  /** Whether this test case's details are hidden from the client */
  isHidden: boolean;
  /** Wall-clock execution time in ms */
  executionTimeMs: number;
  /** Whether execution hit the timeout */
  timedOut: boolean;
}

export interface SubmissionResult {
  /** Aggregated verdict across all test cases */
  verdict: Verdict;
  passed: number;
  total: number;
  /** Total wall-clock runtime in ms (sum of all test cases) */
  runtimeMs: number;
  /** Per-test-case breakdown */
  testResults: TestCaseResult[];
}

// ─── Raw Executor Output ──────────────────────────────────────────────────────

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  /** Whether output was truncated because it exceeded maxOutputBytes */
  outputTruncated: boolean;
  executionTimeMs: number;
}
