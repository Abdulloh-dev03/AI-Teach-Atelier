import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Settings, PanelRightClose, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatLayoutProps } from "./types";

export function ChatLayout({ children, sidebar, isSidebarOpen, onToggleSidebar }: ChatLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-base text-text-primary transition-colors duration-300">
      {/* Center Chat Area - Main Focus */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-background-base">
        {/* Chat Header */}
        <div className="h-16 border-b border-border-subtle flex items-center justify-between px-8 bg-background-base/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="text-sm italic font-serif tracking-tight text-text-primary">Welcome to Friday AI</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
               variant="ghost" 
               size="icon" 
               onClick={onToggleSidebar}
               className={cn(
                 "h-9 w-9 rounded-xl transition-colors",
                 isSidebarOpen ? "bg-accent/10 text-accent" : "text-text-secondary hover:bg-accent/5"
               )}
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-text-secondary hover:bg-accent/5">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content wrapper */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </main>

      {/* Right Sidebar - Stationary */}
      <div className={cn(
        "h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden border-l border-border-subtle bg-surface-card/30 backdrop-blur-md",
        isSidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 border-none"
      )}>
        <div className="w-80 h-full flex flex-col">
          {sidebar}
        </div>
      </div>
    </div>
  );
}
