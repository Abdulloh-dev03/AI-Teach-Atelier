"use client";

import { useEffect } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  problemId: string;
  language: string;
  code: string;
  onChangeAction: (value: string | undefined) => void;
}

const STARTER_CODE: Record<string, string> = {
  python: "import sys\ninput = sys.stdin.readline\n\n",
  javascript:
    "const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n\n",
  typescript:
    "const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}",
};

export function CodeEditor({
  problemId,
  language,
  code,
  onChangeAction,
}: CodeEditorProps) {
  // Try to load saved code on initial mount
  useEffect(() => {
    const savedCode = localStorage.getItem(`problem-code-${problemId}`);
    if (savedCode) {
      onChangeAction(savedCode);
    } else if (!code && STARTER_CODE[language]) {
      onChangeAction(STARTER_CODE[language]);
    }
  }, [problemId, language]);

  // Save to local storage whenever code changes
  useEffect(() => {
    if (code) {
      localStorage.setItem(`problem-code-${problemId}`, code);
    }
  }, [code, problemId]);

  return (
    <div className="w-full h-full pt-1">
      <Editor
        height="100%"
        language={language === "cpp" ? "cpp" : language}
        theme="vs-dark"
        value={code}
        onChange={onChangeAction}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: { top: 20 },
          fontFamily: "var(--font-mono), monospace",
          glyphMargin: false,
          folding: true,
          lineNumbersMinChars: 3,
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full text-text-muted">
            Loading Editor...
          </div>
        }
      />
    </div>
  );
}
