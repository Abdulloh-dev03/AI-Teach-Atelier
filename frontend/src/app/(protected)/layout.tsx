"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setIsMobileOpen(false);
      } else if (width < 1024) {
        setIsCollapsed(true);
      } else {
        // Desktop: use saved or default to expanded
        setIsCollapsed(saved ? JSON.parse(saved) : false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background-base text-text-primary selection:bg-primary/10">
      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-primary/10 backdrop-blur-md z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container - FIXED */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-sidebar-bg border-r border-border-subtle overflow-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-18" : "w-60"
        )}
      >
        <Sidebar isCollapsed={isCollapsed} onToggleAction={toggleSidebar} />
      </aside>

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          "md:pl-60",
          isCollapsed && "md:pl-18"
        )}
      >
        
        <main className={cn(
          "flex-1 bg-background-base relative",
          pathname !== "/chat" && "overflow-y-auto"
        )}>
          {/* Mobile Menu Trigger - Floating */}
          <div className="md:hidden fixed top-4 left-4 z-40">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="bg-background-base/80 backdrop-blur-md shadow-lg border-border-subtle"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}