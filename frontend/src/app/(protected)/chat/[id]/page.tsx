"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { 
  useGetSessionQuery, 
  useSendMessageMutation, 
  useEditMessageMutation, 
  useRegenerateMutation 
} from "@/store/chatApi";

export default function ActiveChatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  const [activeModel, setActiveModel] = useState("qwen");
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data: sessionData, isFetching: isFetchingSession } = useGetSessionQuery(chatId, {
    skip: !chatId,
  });
  
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [editMessage] = useEditMessageMutation();
  const [regenerateResponse, { isLoading: isRegenerating }] = useRegenerateMutation();
  const messages = sessionData?.messages ?? [];

  const handleSendMessage = async (imageUrl?: string) => {
    if (!chatId || !inputValue.trim()) return;

    try {
      await sendMessage({
        sessionId: chatId,
        content: inputValue,
        imageUrl,
        aiModel: activeModel,
      }).unwrap();

      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await editMessage({ messageId, content: newContent, aiModel: activeModel }).unwrap();
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleRegenerate = async () => {
    if (!chatId) return;

    try {
      await regenerateResponse({ 
        sessionId: chatId, 
        aiModel: activeModel 
      }).unwrap();
    } catch (error) {
      console.error("Failed to regenerate:", error);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-background-base">
      <ChatLayout
        sidebar={
          <ChatSidebar 
            activeSessionId={chatId}
            onSelectSession={(id) => router.push(`/chat/${id}`)}
            onNewChat={() => router.push('/chat')}
          />
        }
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      >
        <div className="flex flex-col h-full w-full">
          <MessageList 
            messages={messages} 
            isLoading={isSending || isFetchingSession} 
            onEditMessage={handleEditMessage}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
          
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
