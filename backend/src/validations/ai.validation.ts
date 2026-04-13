import { z } from "zod";
import logger from "#src/config/logger.js";
import type { GeneratedProblem } from "#types/index.js";

/**
 * Individual test case schema.
 * - input and expected are strings capped at 10 000 characters.
 * - isHidden must be a boolean.
 */
export const TestCaseSchema = z.object({
  input: z.string().max(10_000, "Test case input exceeds 10 000 characters"),
  expected: z
    .string()
    .max(10_000, "Test case expected output exceeds 10 000 characters"),
  isHidden: z.boolean(),
});

/**
 * Full generated-problem schema.
 *
 * Enforced invariants
 * ───────────────────
 * • title / description / referenceSolution — non-empty strings
 * • slug — kebab-case (lowercase letters, digits, hyphens only)
 * • testCases — exactly 7 items
 *   - index 0–1  → isHidden === false  (visible)
 *   - index 2–6  → isHidden === true   (hidden)
 */
export const GeneratedProblemSchema = z
  .object({
    title: z.string().min(1, "title must not be empty"),
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "slug must be kebab-case (lowercase letters, digits, and hyphens only)",
      ),
    description: z.string().min(1, "description must not be empty"),
    /** Hidden reference solution — never exposed to users. */
    referenceSolution: z.string().min(1, "referenceSolution must not be empty"),
    testCases: z
      .array(TestCaseSchema)
      .length(7, "testCases must contain exactly 7 items"),
  })
  .superRefine((data, ctx) => {
    // Rule: first 2 test cases must be visible (isHidden === false)
    for (let i = 0; i < 2; i++) {
      if (data.testCases[i]!.isHidden !== false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["testCases", i, "isHidden"],
          message: `testCases[${i}].isHidden must be false (visible test case)`,
        });
      }
    }

    // Rule: remaining 5 test cases must be hidden (isHidden === true)
    for (let i = 2; i < 7; i++) {
      if (data.testCases[i]!.isHidden !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["testCases", i, "isHidden"],
          message: `testCases[${i}].isHidden must be true (hidden test case)`,
        });
      }
    }

    // Warning: for transformation-style problems, identical input/expected
    // is suspicious but not fatal — we log and continue.
    for (let i = 0; i < data.testCases.length; i++) {
      const tc = data.testCases[i]!;
      if (tc.input === tc.expected && tc.input.length > 0) {
        logger.warn(
          `[validateProblem] testCases[${i}]: input === expected ("${tc.input.slice(0, 60)}..."). ` +
            "This may indicate an error in a transformation problem.",
        );
      }
    }
  });

/**
 * Validates a raw parsed object against the GeneratedProblemSchema using Zod.
 *
 * @throws {Error} with a descriptive message if validation fails.
 * @returns The validated, fully-typed GeneratedProblem.
 */
export const validateGeneratedProblem = (raw: unknown): GeneratedProblem => {
  const result = GeneratedProblemSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    const message = `Generated problem failed Zod validation:\n${issues}`;
    logger.error(message, { raw });
    throw new Error(message);
  }

  return result.data as GeneratedProblem;
};
