"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignOutMutation, useGetProfileQuery } from "@/store/authApi";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Sparkles } from "lucide-react";
import { ModeToggle } from "./theme-toggle";


export function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { data: user } = useGetProfileQuery();
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut().unwrap();
      router.push("/");
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  return (
    <nav className="h-16 bg-header-bg/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 border-b border-border-subtle shadow-sm">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden text-text-secondary"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-3 group"
        >
          <div className="bg-accent/5 p-2 rounded-xl group-hover:bg-accent/10 transition-colors">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="text-text-primary font-bold tracking-tight">AI Teach</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />
        
        {user && (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-sm font-bold text-text-primary">{user.name}</span>
               <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                 {(user as any).role || "Scholar"}
               </span>
            </div>

            <div className="h-8 w-px bg-[rgba(196,198,207,0.2)] hidden sm:block" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="h-9 px-4 rounded-xl cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
