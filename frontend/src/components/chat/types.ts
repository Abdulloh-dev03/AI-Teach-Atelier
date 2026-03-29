export type MessageRole = "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: string;
  code?: string;
  footer?: string;
}

export interface ChatLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export interface MessageItemProps {
  message: Message;
}

export interface MusingItemProps {
  title: string;
  time: string;
  active?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export interface ChatSidebarProps {
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}
