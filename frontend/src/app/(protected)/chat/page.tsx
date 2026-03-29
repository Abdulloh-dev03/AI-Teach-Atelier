"use client";
import { useState, useCallback, useEffect } from "react";
import { ChatLayout } from "@/components/chat/chat-layout";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { Message } from "@/components/chat/types";
import { useGetSessionQuery, useSendMessageMutation } from "@/store/chatApi";

export default function ChatPage() {
  const [activeModel, setActiveModel] = useState("qwen"); // Match backend: qwen, llama, openai
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch current session messages
  const { data: sessionData, isFetching: isFetchingSession } = useGetSessionQuery(activeSessionId!, {
    skip: !activeSessionId,
  });

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Update local messages when session data changes
  useEffect(() => {
    if (sessionData && !isFetchingSession) {
      const formattedMessages: Message[] = sessionData.messages.map((m: any) => ({
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
      setMessages(formattedMessages);
    } else if (!activeSessionId) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm your Friday AI. How can I help you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    }
  }, [sessionData, isFetchingSession, activeSessionId]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");

    // Optimistically add user message
    const tempUserMsg: Message = {
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendMessage({
        content,
        aiModel: activeModel,
        sessionId: activeSessionId,
      }).unwrap();

      if (!activeSessionId && result.sessionId) {
        setActiveSessionId(result.sessionId);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [inputValue, isSending, activeModel, activeSessionId, sendMessage]);

  const handleNewChat = () => {
    setActiveSessionId(undefined);
    setMessages([]);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-background-base">
      <ChatLayout
        sidebar={
          <ChatSidebar 
            activeSessionId={activeSessionId} 
            onSelectSession={setActiveSessionId}
            onNewChat={handleNewChat}
          />
        }
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      >
        <div className="flex flex-col h-full w-full">
          <MessageList messages={messages} isLoading={isSending} />
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