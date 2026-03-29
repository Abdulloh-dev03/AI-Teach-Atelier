import { judge } from "#src/services/judgeService.js";
import type { Request, Response } from "express";
import type { SupportedLanguage } from "#src/types/judge.js";

/**
 * Maps the internal Verdict enum from the judge service to 
 * the status strings your frontend expects.
 */
function formatStatus(verdict: string): string {
  switch (verdict) {
    case "ACCEPTED": return "Passed";
    case "WRONG_ANSWER": return "Wrong Answer";
    case "TIME_LIMIT_EXCEEDED": return "Time Limit Exceeded";
    case "RUNTIME_ERROR": return "Runtime Error";
    case "COMPILATION_ERROR": return "Compilation Error";
    case "OUTPUT_LIMIT_EXCEEDED": return "Output Limit Exceeded";
    default: return verdict.replace(/_/g, " ");
  }
}

export const executeCode = async (req: Request, res: Response) => {
  const { code, testCases, language } = req.body;

  if (!code || !testCases || !language) {
    return res.status(400).json({
      error: "Code, testCases, and language are required",
    });
  }

  try {
    // Instead of looping and running code manually, let the judge service
    // handle the wrapping, execution, and parallelization.
    const judgeResult = await judge({
      code,
      language: language as SupportedLanguage,
      testCases,
    });

    // Map the results back to the format your frontend previously used
    const results = judgeResult.testResults.map((tr) => ({
      input: tr.input,
      expected: tr.expected,
      received: tr.timedOut ? "Timed out" : tr.stdout,
      stderr: tr.stderr || null,
      status: formatStatus(tr.verdict),
    }));

    return res.json({
      status: judgeResult.verdict, // Top-level verdict for the whole run
      passed: judgeResult.passed,
      total: judgeResult.total,
      runtime: judgeResult.runtimeMs,
      results: results,
    });
  } catch (error) {
    console.error("[executeCode] execution failed:", error);
    return res.status(500).json({ 
      error: "An error occurred while executing the code." 
    });
  }
};