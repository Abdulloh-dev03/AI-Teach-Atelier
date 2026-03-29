import { InferenceClient } from "@huggingface/inference";
import logger from "#src/config/logger.js";

import type {
  GeneratedProblem,
  AIFeedbackResult,
  GenerateProblemParams,
  FeedbackParams,
} from "#types/index.js";

// ─── Client ───────────────────────────────────────────────────────────────────
// Single InferenceClient instance reused across all calls

const getClient = (): InferenceClient => {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN is not set in environment variables");
  return new InferenceClient(token);
};

// ─── Models ───────────────────────────────────────────────────────────────────
//
// Qwen2.5-72B  — strong instruction following + reliable JSON output
//                used for problem generation where structure is critical
//
// Mistral-7B   — lighter and faster, great for explanations and feedback
//                used for AI feedback where speed matters more than JSON
//
// To force the cheapest provider append ':cheapest' to the model id e.g:
//   'Qwen/Qwen2.5-72B-Instruct:cheapest'
// To pin a specific provider append its name e.g:
//   'Qwen/Qwen2.5-72B-Instruct:sambanova'

const MODELS = {
  generation: "Qwen/Qwen2.5-72B-Instruct",
  feedback: "mistralai/Mistral-7B-Instruct-v0.3",
} as const;

// ─── Prompts ──────────────────────────────────────────────────────────────────

const buildGenerationPrompt = ({
  language,
  difficulty,
}: GenerateProblemParams): string =>
  `
You are a coding challenge creator. Generate a ${difficulty} difficulty coding problem
for the ${language} programming language.

STRICT RULES:
- Do NOT include any solution, hint toward a solution, or pseudocode
- Do NOT reference well-known problems (e.g. LeetCode, HackerRank problems)
- Test case inputs and outputs must be deterministic and unambiguous
- The problem must be solvable using only standard library features of ${language}
- Generate exactly 7 test cases: the first 2 with isHidden=false, the remaining 5 with isHidden=true

Respond with ONLY a valid JSON object in this exact shape, no markdown, no explanation:
{
  "title": "string",
  "slug": "kebab-case-unique-slug",
  "description": "Full problem description with input/output format and constraints",
  "testCases": [
    { "input": "string", "expected": "string", "isHidden": false },
    { "input": "string", "expected": "string", "isHidden": false },
    { "input": "string", "expected": "string", "isHidden": true },
    { "input": "string", "expected": "string", "isHidden": true },
    { "input": "string", "expected": "string", "isHidden": true },
    { "input": "string", "expected": "string", "isHidden": true },
    { "input": "string", "expected": "string", "isHidden": true }
  ]
}
`.trim();

const buildFeedbackPrompt = ({
  code,
  language,
  problemDescription,
  passed,
  total,
}: FeedbackParams): string =>
  `
You are a coding mentor reviewing a student's solution. Your role is to guide, not solve.

Problem:
${problemDescription}

Student's ${language} solution (passed ${passed}/${total} test cases):
\`\`\`${language}
${code}
\`\`\`

STRICT RULES:
- Do NOT provide the correct solution or working code
- Do NOT rewrite their code for them
- DO point out logical issues, edge cases they may have missed, or inefficiencies
- DO explain complexity if relevant
- Keep your tone encouraging and educational

Respond with ONLY a valid JSON object in this exact shape, no markdown, no explanation:
{
  "analysis": "What the student's approach does and where it goes wrong",
  "suggestions": "Specific hints to guide them toward the solution without giving it away",
  "complexity": "Time and space complexity of their current approach"
}
`.trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Remove <think>...</think> chain-of-thought blocks that Qwen models
 * sometimes emit before the actual answer.
 */
const stripThinkingBlocks = (raw: string): string =>
  raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

/**
 * Strip leading/trailing markdown code fences (```json ... ``` or ``` ... ```).
 * Handles fences that may appear anywhere in the string, not just at the edges.
 */
const stripMarkdownFences = (raw: string): string =>
  raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();

/**
 * Brace-matching extractor — finds the first complete {...} object in a string
 * by counting opening and closing braces. This lets us ignore any surrounding
 * prose, extra text, or partial markdown the model may have emitted.
 *
 * Returns null if no balanced JSON object is found.
 */
const extractJSON = (raw: string): string | null => {
  let depth = 0;
  let start = -1;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    // Skip characters inside string literals to avoid counting braces inside them
    if (ch === '"') {
      i++;
      while (i < raw.length) {
        if (raw[i] === "\\") {
          i++; // skip escaped character
        } else if (raw[i] === '"') {
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return raw.slice(start, i + 1);
      }
    }
  }

  return null;
};

/**
 * Robust JSON parser that:
 * 1. Strips <think>...</think> CoT blocks
 * 2. Strips markdown fences
 * 3. Extracts the first balanced {...} object via brace-matching
 * 4. Falls back to a plain JSON.parse on the cleaned string
 *
 * Throws only if no valid JSON object can be found at all.
 */
const parseJSON = <T>(raw: string, context: string): T => {
  // Stage 1: remove chain-of-thought reasoning blocks
  const noThinking = stripThinkingBlocks(raw);

  // Stage 2: strip markdown fences
  const noFences = stripMarkdownFences(noThinking);

  // Stage 3: try brace-matching extraction first (handles surrounding prose)
  const extracted =
    extractJSON(noFences) ?? extractJSON(noThinking) ?? extractJSON(raw);

  if (extracted) {
    try {
      return JSON.parse(extracted) as T;
    } catch {
      // extracted block was found but still not valid JSON — fall through
    }
  }

  // Stage 4: last-ditch plain parse on the fully-cleaned string
  try {
    return JSON.parse(noFences) as T;
  } catch {
    logger.error(`Failed to parse AI JSON response in ${context}`, { raw });
    throw new Error(`AI returned invalid JSON (${context})`);
  }
};

const extractText = (
  response: Awaited<ReturnType<InferenceClient["chatCompletion"]>>,
): string => {
  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI response had no text content");
  return text;
};

// ─── Problem generation ───────────────────────────────────────────────────────

export const generateProblemFromAI = async (
  params: GenerateProblemParams,
): Promise<GeneratedProblem> => {
  const client = getClient();
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 1_000;

  logger.info(
    `Generating ${params.difficulty} ${params.language} problem via HuggingFace`,
  );

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      logger.warn(
        `[generateProblem] Retry attempt ${attempt}/${MAX_ATTEMPTS} after failure`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    let response: Awaited<ReturnType<InferenceClient["chatCompletion"]>>;
    try {
      response = await client.chatCompletion({
        model: MODELS.generation,
        messages: [{ role: "user", content: buildGenerationPrompt(params) }],
        max_tokens: 2048,
        temperature: 0.4,
      });
    } catch (err) {
      logger.error(
        `[generateProblem] HuggingFace call failed on attempt ${attempt}`,
        err,
      );
      lastError = new Error("Failed to reach AI provider");
      continue;
    }

    let parsed: GeneratedProblem;
    try {
      const raw = extractText(response);
      parsed = parseJSON<GeneratedProblem>(raw, "generateProblem");
    } catch (err) {
      logger.warn(
        `[generateProblem] JSON parse failed on attempt ${attempt}`,
        err,
      );
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }

    // Sanity check — ensure the shape matches what the DB expects
    if (
      !parsed.title ||
      !parsed.slug ||
      !parsed.description ||
      !Array.isArray(parsed.testCases) ||
      parsed.testCases.length !== 7
    ) {
      logger.warn(
        `[generateProblem] Shape check failed on attempt ${attempt}`,
        { title: parsed.title, testCaseCount: parsed.testCases?.length },
      );
      lastError = new Error("AI response did not match expected shape");
      continue;
    }

    logger.info(
      `Problem generated successfully: "${parsed.title}" (attempt ${attempt})`,
    );
    return parsed;
  }

  // All attempts exhausted
  logger.error("[generateProblem] All attempts failed", {
    lastError: lastError.message,
  });
  throw lastError;
};

// ─── AI feedback ──────────────────────────────────────────────────────────────

export const generateFeedbackFromAI = async (
  params: FeedbackParams,
): Promise<AIFeedbackResult> => {
  const client = getClient();

  logger.info(
    `Generating AI feedback via HuggingFace (${params.passed}/${params.total} passed)`,
  );

  let response: Awaited<ReturnType<InferenceClient["chatCompletion"]>>;
  try {
    response = await client.chatCompletion({
      model: MODELS.feedback,
      messages: [{ role: "user", content: buildFeedbackPrompt(params) }],
      max_tokens: 512,
      temperature: 0.4, // more deterministic for feedback
    });
  } catch (err) {
    logger.error("HuggingFace feedback call failed", err);
    throw new Error("Failed to reach AI provider");
  }

  const raw = extractText(response);
  const parsed = parseJSON<AIFeedbackResult>(raw, "generateFeedback");

  if (!parsed.analysis || !parsed.suggestions || !parsed.complexity) {
    logger.error("AI feedback response failed sanity check", { parsed });
    throw new Error("AI feedback response did not match expected shape");
  }

  return parsed;
};
