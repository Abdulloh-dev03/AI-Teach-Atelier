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

      case "java":
        // Matches: public [Type] myFunc(
        match = code.match(
          /public\s+(?:static\s+)?[a-zA-Z0-9_<>\[\]]+\s+([a-zA-Z0-9_]+)\s*\(/,
        );
        return match ? match[1] || "solution" : "solution";

      case "c":
      case "cpp":
        // Matches: [Type] myFunc(
        match = code.match(/(?:[a-zA-Z0-9_<>:]+[\s\*&]+)+([a-zA-Z0-9_]+)\s*\(/);
        return match ? match[1] || "solution" : "solution";

      case "go":
        // Matches: func myFunc(
        match = code.match(/func\s+([a-zA-Z0-9_]+)\s*\(/);
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
      case "java":
        return this.wrapJava(code, targetFunc);
      case "c":
        return this.wrapC(code, targetFunc);
      case "cpp":
        return this.wrapCpp(code, targetFunc);
      case "go":
        return this.wrapGo(code, targetFunc);
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

  private static wrapJava(code: string, funcName: string): string {
    return `
import java.util.Scanner;

public class Solution {
    ${code}

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Read all input
        scanner.useDelimiter("\\\\A");
        String input = scanner.hasNext() ? scanner.next() : "";
        scanner.close();
        
        Solution sol = new Solution();
        Object result = sol.${funcName}(input);
        if (result != null) {
            System.out.println(result);
        }
    }
}
`;
  }

  private static wrapC(code: string, funcName: string): string {
    return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${code}

int main() {
    // Read all input from stdin
    char buffer[4096];
    size_t length = 0;
    size_t current_size = 4096;
    char *input = malloc(current_size);
    if (!input) return 1;
    input[0] = '\\0';

    while (fgets(buffer, sizeof(buffer), stdin) != NULL) {
        size_t chunk_len = strlen(buffer);
        if (length + chunk_len + 1 > current_size) {
            current_size *= 2;
            input = realloc(input, current_size);
            if (!input) return 1;
        }
        strcat(input, buffer);
        length += chunk_len;
    }

    // Call the solution
    char* result = ${funcName}(input);
    if (result != NULL) {
        printf("%s\\n", result);
    }

    free(input);
    return 0;
}
`;
  }

  private static wrapCpp(code: string, funcName: string): string {
    return `
#include <iostream>
#include <string>

${code}

int main() {
    std::string input;
    std::string line;
    while (std::getline(std::cin, line)) {
        input += line + "\\n";
    }
    // Remove the trailing newline added by the loop, if input was not empty
    if (!input.empty() && input.back() == '\\n') {
        input.pop_back();
    }
    
    auto result = ${funcName}(input);
    std::cout << result << std::endl;
    return 0;
}
`;
  }

  private static wrapGo(code: string, funcName: string): string {
    return `
package main

import (
    "fmt"
    "io/ioutil"
    "os"
)

${code}

func main() {
    bytes, _ := ioutil.ReadAll(os.Stdin)
    input := string(bytes)
    
    result := ${funcName}(input)
    if result != nil {
        fmt.Println(result)
    }
}
`;
  }
}
