import { spawn } from "child_process";
import { randomUUID } from "crypto";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import * as ts from "typescript";

import type { ExecutionResult } from "#types/judge.js";
import logger from "#config/logger.js";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MEMORY_MB = 128;
const DEFAULT_MAX_OUTPUT_BYTES = 1_048_576; // 1MB

/**
 * Reusable execution router for hybrid execution pattern.
 * Supports running JavaScript/TypeScript locally and Python through the Judge0 API.
 */
export const executionRouter = async (
  code: string,
  input: string,
  language: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  memoryMb: number = DEFAULT_MEMORY_MB,
  maxOutputBytes: number = DEFAULT_MAX_OUTPUT_BYTES
): Promise<ExecutionResult> => {
  const t0 = Date.now();

  try {
    if (language === "javascript") {
      return await executeLocalNodeJS(code, input, timeoutMs, memoryMb, maxOutputBytes);
    } else if (language === "typescript") {
      try {
        const transpiled = ts.transpileModule(code, {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        });
        return await executeLocalNodeJS(transpiled.outputText, input, timeoutMs, memoryMb, maxOutputBytes);
      } catch (err: any) {
        logger.error(`TypeScript transpilation failed: ${err.message}`);
        return {
          stdout: "",
          stderr: "TypeScript compilation error",
          exitCode: 1,
          timedOut: false,
          outputTruncated: false,
          executionTimeMs: Date.now() - t0,
        };
      }
    } else if (language === "python" || language === "python3") {
      return await executeJudge0Python(code, input, timeoutMs, maxOutputBytes);
    } else {
      logger.warn(`Language not explicitly supported in executionRouter: ${language}. Falling back to error.`);
      return {
        stdout: "",
        stderr: `Execution routing not implemented for language: ${language}`,
        exitCode: 1,
        timedOut: false,
        outputTruncated: false,
        executionTimeMs: Date.now() - t0,
      };
    }
  } catch (error: any) {
    logger.error(`executionRouter unexpected error for ${language}: ${error.message}`);
    return {
      stdout: "",
      stderr: error.message || "Internal execution error",
      exitCode: 1,
      timedOut: false,
      outputTruncated: false,
      executionTimeMs: Date.now() - t0,
    };
  }
};

/**
 * Executes JS code locally using child_process.spawn.
 */
const executeLocalNodeJS = async (
  code: string,
  input: string,
  timeoutMs: number,
  memoryMb: number,
  maxOutputBytes: number
): Promise<ExecutionResult> => {
  return new Promise(async (resolve) => {
    const t0 = Date.now();
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `exec_${randomUUID()}.js`);
    
    let isFinished = false;
    let stdoutData = "";
    let stderrData = "";
    let outputTruncated = false;
    let timedOut = false;
    let totalOutputBytes = 0;

    try {
      // Write code to temp file
      await fsPromises.writeFile(tempFilePath, code, "utf-8");
    } catch (err: any) {
      logger.error(`Failed to write temp file ${tempFilePath}: ${err.message}`);
      return resolve({
        stdout: "",
        stderr: "Internal server error: Failed to create temp file",
        exitCode: 1,
        timedOut: false,
        outputTruncated: false,
        executionTimeMs: Date.now() - t0,
      });
    }

    const args = [`--max-old-space-size=${memoryMb}`, tempFilePath];
    const child = spawn("node", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const finish = async (exitCode: number | null) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeoutId);
      
      try {
        await fsPromises.unlink(tempFilePath);
      } catch (err: any) {
        logger.warn(`Failed to cleanup temp file ${tempFilePath}: ${err.message}`);
      }
      
      resolve({
        stdout: stdoutData,
        stderr: stderrData,
        exitCode,
        timedOut,
        outputTruncated,
        executionTimeMs: Date.now() - t0,
      });
    };

    // Timeout protection using setTimeout → kill process (SIGKILL)
    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (!isFinished) {
         child.kill("SIGKILL");
      }
    }, timeoutMs);

    // Prevent overflow by truncating and killing process
    const handleDataChunk = (chunk: Buffer, isStdout: boolean) => {
      if (outputTruncated) return;
      
      totalOutputBytes += chunk.length;
      if (totalOutputBytes > maxOutputBytes) {
        outputTruncated = true;
        
        // Append whatever fits before truncating
        const remainingBytes = maxOutputBytes - (totalOutputBytes - chunk.length);
        if (remainingBytes > 0) {
            const allowedChunk = chunk.subarray(0, remainingBytes);
            if (isStdout) stdoutData += allowedChunk.toString("utf-8");
            else stderrData += allowedChunk.toString("utf-8");
        }
        
        child.kill("SIGKILL");
        return;
      }
      
      if (isStdout) {
        stdoutData += chunk.toString("utf-8");
      } else {
        stderrData += chunk.toString("utf-8");
      }
    };

    child.stdout.on("data", (chunk: Buffer) => handleDataChunk(chunk, true));
    child.stderr.on("data", (chunk: Buffer) => handleDataChunk(chunk, false));

    child.on("error", (error) => {
      if (!isFinished) {
        stderrData += `\nFailed to start node process: ${error.message}`;
        finish(1);
      }
    });

    child.on("close", (code) => {
      finish(code);
    });

    if (input) {
       // Using UTF-8 when writing the stdin input
       child.stdin.write(input, "utf-8");
    }
    child.stdin.end();
  });
};

/**
 * Execute Python via Judge0 API primary endpoint and includes fallback logic.
 */
const executeJudge0Python = async (
  code: string,
  input: string,
  timeoutMs: number,
  maxOutputBytes: number
): Promise<ExecutionResult> => {
  const t0 = Date.now();
  const primaryApi = process.env.PRIMARY_API;
  const secondaryApi = process.env.SECONDARY_API;

  if (!primaryApi || !secondaryApi) {
    throw new Error("Judge0 API endpoints not configured");
  }

  /** helper to execute and handle abort for individual API calls */
  const executeWithTimeout = async (url: string) => {
    // Add small buffer to api timeout so judge0 can reply with TLE status natively
    const requestTimeoutMs = timeoutMs + 2000; 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    
    try {
      // In a newer node, global fetch is available; using standard fetch logic.
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: 71, // Judge0 ID for Python
          stdin: input,
          cpu_time_limit: timeoutMs / 1000.0,
        }),
        signal: controller.signal as RequestInit["signal"],
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    let response: Response;
    try {
      response = await executeWithTimeout(primaryApi);
      if (!response.ok) {
        throw new Error(`Primary API responded with status ${response.status}`);
      }
    } catch (err: any) {
      logger.warn(`Primary Judge0 API failed (${err.message}). Retrying with fallback...`);
      // Retry once using fallback API
      response = await executeWithTimeout(secondaryApi);
      if (!response.ok) {
        throw new Error(`Fallback API also failed with status ${response.status}`);
      }
    }

    const data: any = await response.json();
    
    // Normalize response according to requirements format
    let stdoutData = data.stdout ?? "";
    let stderrData = data.stderr ?? data.compile_output ?? "";
    const exitCode = data.status?.id === 3 ? 0 : 1;
    const timedOut = data.status?.id === 5; // Time Limit Exceeded per judge0 statuses
    const executionTimeMs = data.time ? parseFloat(data.time) * 1000 : Date.now() - t0;

    let outputTruncated = false;
    // Enforce limits for API response as well to prevent huge memory buildup after response parsing
    if (Buffer.byteLength(stdoutData, "utf-8") > maxOutputBytes) {
      stdoutData = Buffer.from(stdoutData, "utf-8").subarray(0, maxOutputBytes).toString("utf-8");
      outputTruncated = true;
    }
    if (Buffer.byteLength(stderrData, "utf-8") > maxOutputBytes) {
      stderrData = Buffer.from(stderrData, "utf-8").subarray(0, maxOutputBytes).toString("utf-8");
      outputTruncated = true;
    }

    return {
      stdout: stdoutData,
      stderr: stderrData,
      exitCode,
      timedOut,
      outputTruncated,
      executionTimeMs,
    };

  } catch (err: any) {
    logger.error(`executeJudge0Python completely failed: ${err.message}`);
    const timedOut = err.name === "AbortError";
    return {
      stdout: "",
      stderr: timedOut ? "Execution timed out via API request." : `API Error: ${err.message}`,
      exitCode: 1,
      timedOut,
      outputTruncated: false,
      executionTimeMs: Date.now() - t0,
    };
  }
};
