"use client";

import { useRef } from "react";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { MessageItem } from "./message-item";
import { Message } from "./types";
import { Leapfrog } from 'ldrs/react'
import 'ldrs/react/Leapfrog.css'
interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll whenever messages change
  useAutoScroll(scrollRef, [messages, isLoading]);

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden bg-background-base flex flex-col items-center">
      <div ref={scrollRef} className="flex-1 w-full max-w-3xl overflow-y-auto py-10 px-6 md:px-8 scroll-smooth no-scrollbar">
        <div className="space-y-12">
          {messages.map((msg, index) => (
            <MessageItem key={`${msg.timestamp}-${index}`} message={msg} />
          ))}

          {/* --- THE THINKING EFFECT --- */}
          {isLoading && (
            <Leapfrog
              size="40"
              speed="2.5"
              color="grey" 
            />
          )}
        </div>
      </div>
    </div>
  );
}




