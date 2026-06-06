"use client";

import { useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  problemId: string;
  language: string;
  code: string;
  onChangeAction: (value: string | undefined) => void;
}

const STARTER_CODE: Record<string, string> = {
  python: "# Write your Python solution here.\n",
  javascript: "// Write your JavaScript solution here.\n",
  typescript: "// Write your TypeScript solution here.\n",
  cpp: "// Write your C++ solution here.\n",
};

const BROKEN_PLACEHOLDERS = new Set([
  "Python Cod",
  "Python Code",
  "JavaScript Cod",
  "JavaScript Code",
  "TypeScript Cod",
  "TypeScript Code",
  "C++ Cod",
  "C++ Code",
]);

const getStarterCode = (language: string) => STARTER_CODE[language] ?? "";

const normalizeInitialCode = (value: string | null, language: string) => {
  if (!value || BROKEN_PLACEHOLDERS.has(value.trim())) {
    return getStarterCode(language);
  }

  return value;
};

export function CodeEditor({
  problemId,
  language,
  code,
  onChangeAction,
}: CodeEditorProps) {
  const storageKey = useMemo(() => `problem-code-${problemId}`, [problemId]);
  const pendingInitialCodeRef = useRef<{
    storageKey: string;
    code: string;
  } | null>(null);

  // Load saved code when switching to a new problem or language.
  useEffect(() => {
    const savedCode = localStorage.getItem(storageKey);
    const initialCode = normalizeInitialCode(savedCode, language);

    pendingInitialCodeRef.current = { storageKey, code: initialCode };
    onChangeAction(initialCode);
  }, [storageKey, language, onChangeAction]);

  // Save to local storage whenever code changes after the initial load settles.
  useEffect(() => {
    const pendingInitialCode = pendingInitialCodeRef.current;

    if (pendingInitialCode?.storageKey === storageKey) {
      if (code !== pendingInitialCode.code) return;
      pendingInitialCodeRef.current = null;
    }

    localStorage.setItem(storageKey, code);
  }, [code, storageKey]);

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
