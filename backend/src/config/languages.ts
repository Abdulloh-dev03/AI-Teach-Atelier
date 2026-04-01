import { SupportedLanguage } from "#src/types/judge.js";

export interface LanguageConfig {
  /** Docker image to use for this language */
  image: string;
  /** Command + args to run the solution file */
  run: string[];
  /** File extension for the solution file */
  extension: string;
  /** Extra compile step before running (optional) */
  compile?: string[];
}

export const languages: Record<string, LanguageConfig> = {
  javascript: {
    image: "node:22-alpine",
    run: ["node", "solution.js"],
    extension: "js",
  },
  typescript: {
    image: "node:22-alpine",
    run: ["node", "--experimental-strip-types", "solution.ts"],
    extension: "ts",
  },
  python: {
    image: "python:3.11-alpine",
    run: ["python", "solution.py"],
    extension: "py",
  },
};

export const isSupportedLanguage = (lang: string): lang is SupportedLanguage =>
  lang in languages;
