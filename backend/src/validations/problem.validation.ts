import { z } from "zod";
import { languages } from "#config/languages.js";

// Derive the enum values directly from the languages config so this schema
// never goes out of sync when new languages are added.
const supportedLanguages = Object.keys(languages) as [string, ...string[]];

export const generateProblemSchema = z.object({
  language: z.enum(supportedLanguages, {
    error: `Invalid option: expected one of ${supportedLanguages.map((l) => `"${l}"`).join("|")}`,
  }),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

export const submitSolutionSchema = z.object({
  code: z.string().min(1, "Code cannot be empty").max(50000, "Code too long"),
  language: z.enum(supportedLanguages, {
    error: `Invalid option: expected one of ${supportedLanguages.map((l) => `"${l}"`).join("|")}`,
  }),
});
