import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PanelRightClose, PanelRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatLayoutProps } from "./types";

export function ChatLayout({
  children,
  sidebar,
  isSidebarOpen,
  onToggleSidebar,
}: ChatLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-base text-text-primary transition-colors duration-300">
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-background-base">
        {/* Top-right sidebar toggle (new location) */}
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleSidebar}
            className={cn(
              "h-9 w-9 rounded-2xl transition-all cursor-pointer",
              isSidebarOpen
            )}
          >
            {isSidebarOpen ? (
              <PanelRightClose className="w-5 h-5" />
            ) : (
              <PanelRight className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative pt-6">
          {children}
        </div>
      </main>

      {/* Right Sidebar - Recent Chats */}
      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out shrink-0 border-l border-border-subtle bg-surface-card/30 backdrop-blur-md overflow-hidden",
          isSidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 border-none"
        )}
      >
        <div className="w-80 h-full flex flex-col">{sidebar}</div>
      </div>
    </div>
  );
}