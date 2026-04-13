import { InferenceClient } from "@huggingface/inference";
import logger from "#src/config/logger.js";

import type {
  GeneratedProblem,
  AIFeedbackResult,
  GenerateProblemParams,
  FeedbackParams,
} from "#types/index.js";
import { WrapperService } from "./WrapperService.js";
import { executionRouter } from "./executionRouter.js";
import { validateGeneratedProblem } from "#validations/ai.validation.js";

// Simple in-memory set to avoid generating duplicate titles in the same server session
const generatedTitles = new Set<string>();

const getClient = (): InferenceClient => {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN is not set in environment variables");
  return new InferenceClient(token);
};

const MODELS = {
  generation: "Qwen/Qwen2.5-72B-Instruct",
  feedback: "mistralai/Mistral-7B-Instruct-v0.3",
} as const;

/**
 * Safely executes the referenceSolution using the existing execution infrastructure
 */
async function executeReferenceSolution(
  referenceSolution: string,
  input: string,
  language: string,
): Promise<string> {
  const wrappedCode = WrapperService.wrapCode(
    referenceSolution,
    language as any,
  );

  const result = await executionRouter(
    wrappedCode,
    input,
    language,
    3000, 
    128,
    1024 * 1024, 
  );

  if (result.exitCode !== 0 || result.timedOut || result.stderr) {
    throw new Error(
      `Reference solution execution failed: ${result.stderr || "Unknown error"}`,
    );
  }

  return result.stdout.trim();
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const buildGenerationPrompt = ({
  language,
  difficulty,
}: GenerateProblemParams): string => {
  const randomSeed = Math.random().toString(36).substring(2, 15);

  return `
You are a creative coding problem designer working for a new educational platform.

**CRITICAL MISSION**: Generate a **completely new and original** coding problem that has never been seen before on LeetCode, Codeforces, HackerRank, AtCoder, or any other platform.

━━━━━━━━━━━━━━━━━━━
🚨 FORBIDDEN PROBLEMS — NEVER GENERATE THESE:
━━━━━━━━━━━━━━━━━━━
- Any palindrome related problem (Longest Palindromic Substring, Palindrome Number, etc.)
- Two Sum, Three Sum, Add Two Numbers
- Valid Parentheses, Merge Two Sorted Lists
- Binary Search, Climbing Stairs, FizzBuzz, Reverse Integer
- Any classic easy/medium LeetCode-style problems

Every generation must be UNIQUE and FRESH. Never repeat titles, patterns, or ideas.

Current Request:
- Language: ${language}
- Difficulty: ${difficulty}
- Random Seed (use this to increase uniqueness): ${randomSeed}

━━━━━━━━━━━━━━━━━━━
CREATIVITY GUIDELINES:
━━━━━━━━━━━━━━━━━━━
- Think of real-world scenarios, clever string/array manipulations, simulation problems,
  bit manipulation, greedy algorithms with interesting constraints, or math-related logic.
- Make the title interesting, descriptive, and unique.
- Include clear input/output format and constraints in the description.

━━━━━━━━━━━━━━━━━━━
OUTPUT REQUIREMENTS — ONLY VALID JSON:
━━━━━━━━━━━━━━━━━━━
Return **nothing** except a single valid JSON object. 
No thinking steps, no markdown, no code blocks, no explanations, no <think> tags.

{
  "title": "Creative and unique title here",
  "slug": "unique-kebab-case-slug",
  "description": "Full problem statement including input format, output format, constraints, and examples",
  "referenceSolution": "Full working ${language} code",
  "testCases": [
    {"input": "...", "expected": "...", "isHidden": false},
    {"input": "...", "expected": "...", "isHidden": false},
    {"input": "...", "expected": "...", "isHidden": true},
    {"input": "...", "expected": "...", "isHidden": true},
    {"input": "...", "expected": "...", "isHidden": true},
    {"input": "...", "expected": "...", "isHidden": true},
    {"input": "...", "expected": "...", "isHidden": true}
  ]
}

Exactly 7 test cases:
- First 2 must be visible (isHidden: false)
- Last 5 must be hidden (isHidden: true)
All input and expected values must be strings.
`.trim();
};

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

Respond with ONLY a valid JSON object:
{
  "analysis": "What the student's approach does and where it goes wrong",
  "suggestions": "Specific hints to guide them toward the solution without giving it away",
  "complexity": "Time and space complexity of their current approach"
}
`.trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stripThinkingBlocks = (raw: string): string =>
  raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

const stripMarkdownFences = (raw: string): string =>
  raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();

const cleanCode = (code: string): string => {
  return code
    .replace(/^\s*\d+[:.|]\s?/gm, "")
    .replace(/^```(\w+)?\n/i, "")
    .replace(/\n```$/i, "")
    .trim();
};

const extractJSON = (raw: string): string | null => {
  let depth = 0;
  let start = -1;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === '"') {
      i++;
      while (i < raw.length) {
        if (raw[i] === "\\") i++;
        else if (raw[i] === '"') break;
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

const parseJSON = <T>(raw: string, context: string): T => {
  const noThinking = stripThinkingBlocks(raw);
  const noFences = stripMarkdownFences(noThinking);

  let extracted =
    extractJSON(noFences) ?? extractJSON(noThinking) ?? extractJSON(raw);

  if (!extracted) {
    const regexMatch = noFences.match(/(\{[\s\S]*\})/);
    if (regexMatch) extracted = regexMatch[1];
  }

  if (extracted) {
    try {
      return JSON.parse(extracted) as T;
    } catch (e) {
      logger.error(`JSON parse failed after extraction in ${context}`, {
        extractedPreview: extracted.slice(0, 500) + "...",
      });
    }
  }

  try {
    return JSON.parse(noFences) as T;
  } catch (err) {
    logger.error(`AI returned invalid JSON in ${context}`, {
      raw: raw.length > 3000 ? raw.slice(0, 3000) + "..." : raw,
    });
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

// ─── Main Generation Function ─────────────────────────────────────────────────

export const generateProblemFromAI = async (
  params: GenerateProblemParams,
): Promise<GeneratedProblem> => {
  const client = getClient();
  const MAX_ATTEMPTS = 4;           // Increased slightly
  const RETRY_DELAY_MS = 1200;

  logger.info(`Generating ${params.difficulty} ${params.language} problem via HuggingFace`);

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      logger.warn(`[generateProblem] Retry attempt ${attempt}/${MAX_ATTEMPTS}`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    let response: Awaited<ReturnType<InferenceClient["chatCompletion"]>>;
    try {
      response = await client.chatCompletion({
        model: MODELS.generation,
        messages: [{ role: "user", content: buildGenerationPrompt(params) }],
        max_tokens: 2500,           // Increased for better quality
        temperature: 0.4,           // Slightly higher for creativity
        top_p: 0.92,
        frequency_penalty: 0.8,     // Stronger anti-repetition
        presence_penalty: 0.7,
      });
    } catch (err) {
      logger.error(`[generateProblem] HuggingFace call failed on attempt ${attempt}`, err);
      lastError = new Error("Failed to reach AI provider");
      continue;
    }

    let parsed: unknown;
    try {
      const raw = extractText(response);
      parsed = parseJSON<unknown>(raw, "generateProblem");
    } catch (err) {
      logger.warn(`[generateProblem] JSON parse failed on attempt ${attempt}`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }

    let validated: GeneratedProblem;
    try {
      validated = validateGeneratedProblem(parsed);
    } catch (err) {
      logger.warn(`[generateProblem] Zod validation failed on attempt ${attempt}`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }

    // ── Duplicate title protection ─────────────────────────────────────
    const titleLower = validated.title.toLowerCase().trim();
    if (generatedTitles.has(titleLower)) {
      logger.warn(`Duplicate title detected: "${validated.title}". Retrying...`);
      lastError = new Error("Duplicate problem title generated");
      continue;
    }
    generatedTitles.add(titleLower);

    // ── Clean and validate reference solution ───────────────────────────
    validated.referenceSolution = cleanCode(validated.referenceSolution);

    logger.info(`[generateProblem] Validating ${validated.testCases.length} test cases...`);

    let allTestsPassed = true;

    for (let i = 0; i < validated.testCases.length; i++) {
      const tc = validated.testCases[i]!;

      try {
        const actualOutput = await executeReferenceSolution(
          validated.referenceSolution,
          tc.input,
          params.language,
        );

        if (actualOutput !== tc.expected) {
          logger.warn(
            `[generateProblem] Fixed expected output for test case ${i + 1}. ` +
              `Old: "${tc.expected}" → New: "${actualOutput}"`
          );
          tc.expected = actualOutput;
        }
      } catch (execError: any) {
        logger.warn(`[generateProblem] Reference solution failed on test case ${i + 1}`, {
          input: tc.input,
          error: execError.message,
        });

        lastError = new Error(`Reference solution failed on test case ${i + 1}`);
        allTestsPassed = false;
        break;
      }
    }

    if (!allTestsPassed) {
      continue;
    }

    logger.info(`[generateProblem] Successfully generated: "${validated.title}"`);
    return validated;
  }

  logger.error("[generateProblem] All attempts failed", { lastError: lastError.message });
  throw lastError;
};

// ─── AI Feedback (unchanged) ──────────────────────────────────────────────────

export const generateFeedbackFromAI = async (
  params: FeedbackParams,
): Promise<AIFeedbackResult> => {
  const client = getClient();

  logger.info(`Generating AI feedback (${params.passed}/${params.total} passed)`);

  try {
    const response = await client.chatCompletion({
      model: MODELS.feedback,
      messages: [{ role: "user", content: buildFeedbackPrompt(params) }],
      max_tokens: 512,
      temperature: 0.4,
    });

    const raw = extractText(response);
    const parsed = parseJSON<AIFeedbackResult>(raw, "generateFeedback");

    if (!parsed.analysis || !parsed.suggestions || !parsed.complexity) {
      throw new Error("AI feedback response missing required fields");
    }

    return parsed;
  } catch (err) {
    logger.error("AI feedback generation failed", err);
    throw new Error("Failed to generate AI feedback");
  }
};