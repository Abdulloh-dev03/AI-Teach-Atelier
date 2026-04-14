"use client";

import { useRef } from "react";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { MessageItem } from "./message-item";
import { Message } from "./types";
import { Leapfrog } from "ldrs/react";
import { Sparkles } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  onEditMessage,
  onRegenerate,
  isRegenerating,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useAutoScroll(scrollRef, [messages, isLoading]);

  // Show beautiful welcome when no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-base">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center mb-6">
            <Sparkles className="w-9 h-9 text-accent" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary mb-3">
            Welcome to Friday AI
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Ask me anything, upload an image, or just say hi.<br />
            I’m here to help!
          </p>
          {isLoading && (
            <div className="mt-8 flex justify-center">
              <Leapfrog size="40" speed="2.5" color="grey" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden bg-background-base flex flex-col items-center">
      <div
        ref={scrollRef}
        className="flex-1 w-full max-w-3xl overflow-y-auto py-10 px-6 md:px-8 scroll-smooth custom-scrollbar"
      >
        <div className="space-y-12">
          {messages.map((msg, index) => (
            <MessageItem
              key={`${msg.timestamp}-${index}`}
              message={msg}
              onEdit={onEditMessage}
              onRegenerate={onRegenerate}
              isRegenerating={isRegenerating}
            />
          ))}

          {/* {isLoading && <Leapfrog size="40" speed="2.5" color="grey" />} */}
        </div>
      </div>
    </div>
  );
}
