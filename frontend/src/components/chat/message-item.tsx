"use client";
import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Copy, Check, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useGetProfileQuery } from "@/store/authApi";
import { MessageItemProps } from "./types";
import { Button } from "../ui/button";
import { extensionMap } from "@/types";

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Determine the correct extension based on the language provided
    const extension = extensionMap[language.toLowerCase()] || "txt";
    
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Dynamic filename based on language
    a.download = `scholar-snippet.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative group my-6 rounded-2xl overflow-hidden border border-white/5 bg-[#0d1117] shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] font-bold">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownload}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <Download size={14} />
          </Button>

          <Button
            onClick={handleCopy}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </Button>
        </div>
      </div>

      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "24px",
          background: "transparent",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: {
            background: "transparent",
            fontFamily: "inherit",
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const MessageItem = memo(
  function MessageItem({ message }: MessageItemProps) {
    const isUser = message.role === "user";
    const { data: user } = useGetProfileQuery();
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    return (
      <div
        className={cn(
          "flex animate-in fade-in slide-in-from-bottom-4 duration-700 gap-3 group w-full",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        <Avatar className="w-10 h-10 shrink-0 mt-1 ring-4 ring-background-base shadow-lg border border-border-subtle">
          {isUser ? (
            <AvatarFallback className="bg-text-primary text-background-base text-base font-bold">
              {userInitial}
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-accent text-white">
              <Sparkles className="w-5 h-5" />
            </AvatarFallback>
          )}
        </Avatar>

        <div
          className={cn(
            "px-4 py-3 text-[15px] leading-relaxed rounded-[24px] overflow-hidden max-w-[85%]",
            isUser
              ? "bg-text-primary text-background-base"
              : "bg-surface-card border border-border-subtle text-text-primary"
          )}
        >
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");

                return !inline && match ? (
                  <CodeBlock language={match[1]} value={codeString} />
                ) : (
                  <code
                    className="bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.message.content === next.message.content &&
      prev.message.timestamp === next.message.timestamp
    );
  }
);