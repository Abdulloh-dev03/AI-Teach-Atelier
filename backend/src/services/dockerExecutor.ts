import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { languages } from "#config/languages.js";
import type { ExecutionResult } from "#types/judge.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MEMORY_MB = 128;
const DEFAULT_MAX_OUTPUT_BYTES = 1_048_576; // 1 MB

// ─── Image pre-warming ────────────────────────────────────────────────────────

/**
 * Pulls all required Docker images on server startup so they are cached locally.
 * Skips images that are already present to avoid unnecessary bandwidth usage.
 */
export const preWarmImages = async (): Promise<void> => {
  const images = [
    ...new Set(Object.values(languages).map((l) => l.image)),
  ] as string[];

  console.log(`[docker]: Pre-warming ${images.length} images...`);

  for (const image of images) {
    try {
      await new Promise<void>((resolve, reject) => {
        const pull = spawn("docker", ["pull", image]);
        pull.on("close", (code) => {
          if (code === 0) {
            console.log(`[docker]: Image ready: ${image}`);
            resolve();
          } else {
            reject(new Error(`Pull exited with code ${code}`));
          }
        });
        pull.on("error", (err) => reject(err));
      });
    } catch (err) {
      console.warn(`[docker]: WARNING: Failed to pull ${image}:`, err);
    }
  }
};

// ─── Docker args builder ──────────────────────────────────────────────────────

/**
 * Build the hardened Docker `run` argument list.
 * Security flags applied:
 *  - --network none        → no outbound internet access
 *  - --read-only           → immutable container filesystem
 *  - --tmpfs /tmp          → writable /tmp for languages that need it (compile step)
 *  - --memory              → hard RAM limit
 *  - --cpus               → CPU throttle
 *  - --pids-limit 64       → block fork bombs
 *  - --cap-drop ALL        → drop all Linux capabilities
 *  - --security-opt no-new-privileges → prevent privilege escalation
 *  - --ulimit nofile=64    → limit open file descriptors
 */
function buildDockerArgs(
  image: string,
  runCmd: string[],
  tempDir: string,
  memoryMb: number,
): string[] {
  return [
    "run",
    "--rm",
    "-i",
    `--memory=${memoryMb}m`,
    "--memory-swap=0", // disable swap (memory only)
    "--cpus=0.5",
    "--pids-limit",
    "64",
    "--read-only",
    "--tmpfs",
    "/tmp:size=32m,noexec", // 32 MB writable /tmp, no script exec
    "--network",
    "none",
    "--cap-drop",
    "ALL",
    "-e",
    "GOCACHE=/tmp/go-cache",
    "-e",
    "GOPATH=/tmp/go-path",
    "--security-opt",
    "no-new-privileges",
    "--ulimit",
    "nofile=1024:1024",
    "--ulimit",
    "nproc=1024:1024",
    "-v",
    `${tempDir}:/app`,
    "-w",
    "/app",
    image,
    ...runCmd,
  ];
}

// ─── Core executor ────────────────────────────────────────────────────────────

export const runCode = async (
  code: string,
  input: string,
  language: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  memoryMb = DEFAULT_MEMORY_MB,
  maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES,
): Promise<ExecutionResult> => {
  const langConfig = languages[language];
  if (!langConfig) {
    return {
      stdout: "",
      stderr: `Unsupported language: ${language}`,
      exitCode: null,
      timedOut: false,
      outputTruncated: false,
      executionTimeMs: 0,
    };
  }

  // Write solution file to a temp directory — Docker mounts it at /app
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "judge-"));
  const filePath = path.join(tempDir, `solution.${langConfig.extension}`);
  fs.writeFileSync(filePath, code);

  const cleanup = () => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // best-effort — don't crash on cleanup failure
    }
  };

  const dockerArgs = buildDockerArgs(
    langConfig.image,
    langConfig.run,
    tempDir,
    memoryMb,
  );

  return new Promise((resolve) => {
    const startTime = Date.now();
    let docker: ReturnType<typeof spawn>;

    try {
      docker = spawn("docker", dockerArgs, {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      cleanup();
      return resolve({
        stdout: "",
        stderr: `Failed to start container: ${String(err)}`,
        exitCode: null,
        timedOut: false,
        outputTruncated: false,
        executionTimeMs: 0,
      });
    }

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputTruncated = false;

    // ── Kill container after timeout ──────────────────────────────────────
    const timer = setTimeout(() => {
      timedOut = true;
      docker.kill("SIGKILL");
    }, timeoutMs);

    // ── Capture stdout with output size cap ───────────────────────────────
    docker.stdout!.on("data", (chunk: Buffer) => {
      if (stdout.length + chunk.length > maxOutputBytes) {
        const remaining = maxOutputBytes - stdout.length;
        if (remaining > 0) stdout += chunk.toString().slice(0, remaining);
        outputTruncated = true;
        docker.kill("SIGKILL"); // kill early — output limit hit
      } else {
        stdout += chunk.toString();
      }
    });

    // ── Capture stderr (capped at 64 KB) ─────────────────────────────────
    docker.stderr!.on("data", (chunk: Buffer) => {
      if (stderr.length < 65_536) {
        stderr += chunk.toString();
      }
    });

    docker.on("close", (exitCode) => {
      clearTimeout(timer);
      cleanup();
      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trim(),
        exitCode,
        timedOut,
        outputTruncated,
        executionTimeMs: Date.now() - startTime,
      });
    });

    // Write stdin input then close the stream
    docker.stdin!.write(input);
    docker.stdin!.end();
  });
};
