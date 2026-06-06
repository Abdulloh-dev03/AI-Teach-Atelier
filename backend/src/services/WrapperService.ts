import type { SupportedLanguage } from "#types/judge.js";

/**
 * WrapperService
 *
 * Injects user-submitted code into an executable program template.
 * The generated program typically reads all content from standard input,
 * calls the user's `solution(input)` function, and prints the result to standard output.
 */

export class WrapperService {
  /**
   * Extracted function names caching (for speed if we run identical code).
   * But typically we extract it per-run.
   */
  public static extractFunctionName(
    code: string,
    language: SupportedLanguage,
  ): string {
    // Default fallback
    let match: RegExpMatchArray | null = null;

    switch (language) {
      case "javascript":
      case "typescript":
        // Matches: function myFunc( or const myFunc = function( or const myFunc = (
        match = code.match(
          /(?:function\s+([a-zA-Z0-9_]+)\s*\()|(?:(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/,
        );
        return match ? match[1] || match[2] || "solution" : "solution";

      case "python":
        // Matches: def my_func(
        match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
        return match ? match[1] || "solution" : "solution";

      default:
        return "solution";
    }
  }

  /**
   * Wraps the user's code in a full, runnable program.
   * @param code The user-provided code
   * @param language The target language.
   * @param functionName Optional specific function name to call (if not provided, we try to extract it from the code)
   * @returns The combined string of the wrapper and user code.
   */
  public static wrapCode(
    code: string,
    language: SupportedLanguage,
    functionName?: string,
  ): string {
    const targetFunc = functionName || this.extractFunctionName(code, language);

    switch (language) {
      case "javascript":
      case "typescript":
        return this.wrapNode(code, targetFunc);
      case "python":
        return this.wrapPython(code, targetFunc);
      default:
        // Fallback if an unknown language is passed
        return code;
    }
  }

  private static wrapNode(code: string, funcName: string): string {
    // Reads all of stdin securely and passes it to solution, printing the result.
    return `
const fs = require('fs');
${code}

function main() {
    let input = '';
    try {
        input = fs.readFileSync(0, 'utf-8');
    } catch (e) {
        // Ignored or EOF
    }
    const result = ${funcName}(input);
    if (result !== undefined) {
        console.log(result);
    }
}
main();`;
  }

  private static wrapPython(code: string, funcName: string): string {
    return `
import sys

${code}

if __name__ == "__main__":
    input_data = sys.stdin.read()
    result = ${funcName}(input_data)
    if result is not None:
        print(result)
`;
  }
}
