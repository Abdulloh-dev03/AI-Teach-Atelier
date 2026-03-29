import type { SupportedLanguage } from "#types/judge.js";

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
  java: {
    image: "eclipse-temurin:21-jre-alpine",
    // Compile first, then run — handled by two-step logic in dockerExecutor
    compile: ["javac", "solution.java"],
    run: ["sh", "-c", "javac solution.java && java Solution"],
    extension: "java",
  },
  c: {
    image: "gcc:13",
    run: ["sh", "-c", "gcc solution.c -o solution -lm && ./solution"],
    extension: "c",
  },
  cpp: {
    image: "gcc:13",
    run: ["sh", "-c", "g++ solution.cpp -o solution -lm && ./solution"],
    extension: "cpp",
  },
  go: {
    image: "golang:1.23-alpine",
    run: ["go", "run", "solution.go"],
    extension: "go",
  },
};

export const isSupportedLanguage = (lang: string): lang is SupportedLanguage =>
  lang in languages;
