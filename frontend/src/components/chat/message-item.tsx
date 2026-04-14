"use client";
import { useState, memo, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Pencil,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useGetProfileQuery } from "@/store/authApi";
import { MessageItemProps } from "./types";
import { Button } from "../ui/button";
import { extensionMap } from "@/types";
import { Infinity } from 'ldrs/react'


type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
  node?: unknown;
  children?: ReactNode;
};

const CodeBlock = ({
  language,
  value,
}: {
  language: string;
  value: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = extensionMap[language.toLowerCase()] || "txt";
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `friday-snippet.${extension}`;
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
            className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10"
          >
            <Download size={14} />
          </Button>
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10"
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
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const MessageItem = memo(
  function MessageItem({
    message,
    onEdit,
    onRegenerate,
    isRegenerating,
  }: MessageItemProps & {
    onEdit?: (messageId: string, newContent: string) => void;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
  }) {
    const isUser = message.role === "user";
    const { data: user } = useGetProfileQuery();
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveEdit = () => {
      if (message.id && editedContent.trim() !== message.content) {
        onEdit?.(message.id, editedContent);
      }
      setIsEditing(false);
    };

    const isEmptyAI = !isUser && !message.content.trim();

    return (
      <div
        className={cn(
          "group w-full flex flex-col gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex gap-3 max-w-[85%]",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <Avatar className="w-10 h-10 shrink-0 mt-1 ring-4 ring-background-base shadow-lg border border-border-subtle">
            {isUser ? (
              <AvatarFallback className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-base font-bold">
                {userInitial}
              </AvatarFallback>
            ) : (
              <AvatarFallback className="bg-accent text-white">
                <Sparkles className="w-5 h-5" />
              </AvatarFallback>
            )}
          </Avatar>

          {isEmptyAI ? (
            <div className="flex min-h-12 items-end">
              <div className="flex items-center gap-3 rounded-full bg-white/70 px-4 py-3 text-sm text-text-secondary shadow-sm ring-1 ring-border-subtle backdrop-blur dark:bg-surface-card/90">
                <span className="font-medium">Friday is thinking</span>
                <div className="flex items-center gap-1">
                  <Infinity
                    size="40"
                    stroke="2"
                    strokeLength="0.15"
                    bgOpacity="0.1"
                    speed="1.3"
                    color="gray" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "px-4 py-3 text-[15px] leading-relaxed rounded-[24px] relative transition-colors duration-200",
                isUser
                  ? "bg-blue-600 dark:bg-blue-500 text-white rounded-tr-none shadow-sm"
                  : "bg-white dark:bg-surface-card border border-border-subtle text-zinc-900 dark:text-zinc-100 rounded-tl-none",
              )}
            >
              {isEditing ? (
                <div className="flex flex-col gap-3 min-w-62.5">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className={cn(
                      "w-full bg-transparent outline-none resize-none text-[15px] leading-relaxed",
                      isUser
                        ? "text-white dark:text-zinc-900 placeholder:text-white/50"
                        : "text-zinc-900 dark:text-zinc-100",
                    )}
                    rows={3}
                    autoFocus
                  />
                  <div
                    className={cn(
                      "flex gap-2 justify-end pt-2 border-t",
                      isUser
                        ? "border-white/10"
                        : "border-zinc-100 dark:border-white/5",
                    )}
                  >
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className={isUser ? "text-white bg-transparent " : ""}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className={
                        isUser
                          ? "bg-white text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white"
                          : ""
                      }
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "prose prose-sm max-w-none wrap-break-words",
                    isUser
                      ? "prose-invert dark:prose-neutral"
                      : "dark:prose-invert",
                  )}
                >
                  {message.imageUrl && (
                    <div className="mb-2">
                      <img
                        src={message.imageUrl}
                        alt="Uploaded content"
                        className="rounded-lg max-w-full h-auto border border-border-subtle shadow-sm"
                      />
                    </div>
                  )}
                  <ReactMarkdown
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }: MarkdownCodeProps) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, "")}
                          />
                        ) : (
                          <code
                            className={cn(
                              "px-1.5 py-0.5 rounded font-mono text-sm",
                              isUser
                                ? "bg-white/10 text-white"
                                : "bg-accent/10 text-accent",
                            )}
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
              )}
            </div>
          )}
        </div>

        {/* ACTION ROW */}
        {!isEditing && !isEmptyAI && (
          <div
            className={cn(
              "flex items-center gap-3 px-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            <span className="text-[10px] text-zinc-500/50 dark:text-text-secondary/40 font-bold uppercase tracking-widest">
              {message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "just now"}
            </span>
            <div className="flex items-center gap-1">
              {isUser && message.id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                  onClick={() => {
                    setEditedContent(message.content);
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isUser && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    onClick={onRegenerate}
                    disabled={isRegenerating}
                  >
                    <RefreshCw
                      className={cn(
                        "w-3.5 h-3.5",
                        isRegenerating && "animate-spin",
                      )}
                    />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.message.content === next.message.content &&
    prev.message.timestamp === next.message.timestamp &&
    prev.isRegenerating === next.isRegenerating,
);
