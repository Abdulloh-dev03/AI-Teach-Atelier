import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MusingItemProps, ChatSidebarProps } from "./types";
import { useGetSessionsQuery, useDeleteSessionMutation } from "@/store/chatApi";
import { formatDistanceToNow } from "date-fns";
import { ConfirmModal } from "./confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TailChase } from "ldrs/react";
import "ldrs/react/TailChase.css";
import { useRouter } from "next/navigation";

export function MusingItem({
  title,
  time,
  active = false,
  onClick,
  onDelete,
}: MusingItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "px-4 py-3 rounded-[20px] transition-all duration-300 cursor-pointer flex items-center justify-between group relative",
        active
          ? "bg-accent/10 shadow-sm border border-accent/20"
          : "hover:bg-accent/5 border border-transparent",
      )}
    >
      <div className="flex items-center gap-3 truncate pr-4">
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-500",
            active
              ? "bg-accent scale-125 shadow-[0_0_8px_rgba(var(--accent),0.8)]"
              : "bg-text-secondary/20",
          )}
        />
        <span
          className={cn(
            "text-xs font-bold tracking-tight truncate transition-colors",
            active
              ? "text-text-primary"
              : "text-text-secondary group-hover:text-text-primary",
          )}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] font-bold text-text-secondary/40 uppercase tracking-widest tabular-nums">
          {time}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-text-secondary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 bg-surface-card border-border-subtle p-1 rounded-xl shadow-xl"
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 focus:text-red-500 cursor-pointer rounded-lg p-2.5"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ChatSidebar({
  activeSessionId,
  onNewChat,
}: ChatSidebarProps) {
  const { data, isLoading } = useGetSessionsQuery();
  const [deleteSession] = useDeleteSessionMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionIdToDelete, setSessionIdToDelete] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const sessions = data?.sessions || [];

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) =>
        session.title?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [sessions, searchTerm],
  );

  const handleNewChat = () => {
    // Navigate to the base chat page to clear state
    router.push("/chat");
  };

  const handleSelectSession = (id: string) => {
    // Navigate to the dynamic ID path
    router.push(`/chat/${id}`);
  };

  const handleDeleteSession = async () => {
    if (!sessionIdToDelete) return;
    try {
      await deleteSession(sessionIdToDelete).unwrap();
      if (sessionIdToDelete === activeSessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setSessionIdToDelete(null);
    }
  };
   
  return (
    <>
      <ConfirmModal
        isOpen={!!sessionIdToDelete}
        onClose={() => setSessionIdToDelete(null)}
        onConfirm={handleDeleteSession}
        title="Delete Conversation?"
        description="This action cannot be undone. All messages in this chat will be permanently removed from our servers."
        confirmText="Delete Chat"
      />

      <aside className="hidden xl:flex w-84 h-full border-l border-border-subtle bg-surface-card/30 backdrop-blur-sm shrink-0 flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-secondary">
              Recent Chats
            </h2>
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-border-subtle bg-background-base/50 hover:bg-accent/5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-text-primary" />
            </Button>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Sparkles className="h-3 w-3 text-text-secondary/50 group-focus-within:text-accent transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background-base/50 border border-border-subtle rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-bold uppercase tracking-widest placeholder:text-text-secondary/30 focus:ring-2 ring-accent/10 focus:border-accent/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Sidebar Content - Chats List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <TailChase size="40" speed="1.75" color="grey" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest leading-relaxed">
                {searchTerm ? "No matches found." : "No sessions found."}
                <br />
                {searchTerm
                  ? "Try a different term."
                  : "Start a new conversation."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 px-4 pt-2">
                <span className="text-[9px] font-black text-text-secondary/30 uppercase tracking-[0.2em]">
                  Active Conversations
                </span>
              </div>
              {filteredSessions.map((session) => (
                <MusingItem
                  key={session.id}
                  title={session.title || "Untitled Session"}
                  time={formatDistanceToNow(new Date(session.updatedAt), {
                    addSuffix: true,
                  })}
                  active={activeSessionId === session.id}
                  onDelete={() => setSessionIdToDelete(session.id)}
                  onClick={() => handleSelectSession(session.id)}
                />
              ))}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
