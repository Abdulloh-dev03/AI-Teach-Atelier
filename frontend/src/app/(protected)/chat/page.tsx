"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useSendMessageMutation } from "@/store/chatApi";
import { Message } from "@/components/chat/types";

export default function NewChatPage() {
  const router = useRouter();
  const [activeModel, setActiveModel] = useState("qwen");
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  const handleSendMessage = async (imageUrl?: string) => {
    const trimmedInput = inputValue.trim();

    if (!trimmedInput) return;

    const now = new Date().toISOString();
    setPendingMessages([
      {
        id: `pending-user-${now}`,
        role: "user",
        content: trimmedInput,
        imageUrl,
        createdAt: now,
        timestamp: now,
      },
      {
        id: `pending-assistant-${now}`,
        role: "assistant",
        content: "",
        createdAt: now,
        timestamp: now,
      },
    ]);
    setInputValue("");

    try {
      const response = await sendMessage({
        content: trimmedInput,
        imageUrl,
        aiModel: activeModel,
      }).unwrap();

      if (response && response.sessionId) {
        router.push(`/chat/${response.sessionId}`);
      }
    } catch (error) {
      setPendingMessages([]);
      console.error("Failed to start new chat:", error);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-background-base">
      <ChatLayout
        sidebar={
          <ChatSidebar
            activeSessionId={undefined} 
            onSelectSession={(id) => router.push(`/chat/${id}`)}
            onNewChat={() => {}}
          />
        }
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      >
        <div className="flex flex-col h-full w-full">
          <MessageList messages={pendingMessages} isLoading={isSending} />

          <div className="shrink-0 w-full bg-background-base">
            <ChatInput
              inputValue={inputValue}
              onInputChangeAction={setInputValue}
              activeModel={activeModel}
              onModelChangeAction={setActiveModel}
              onSendMessageAction={handleSendMessage}
            />
          </div>
        </div>
      </ChatLayout>
    </div>
  );
}
