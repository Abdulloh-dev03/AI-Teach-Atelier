import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSignOutMutation, useGetProfileQuery } from "@/store/authApi";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Swords,
  User,
  ChevronLeft,
  Menu,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleAction: () => void;
}

export function Sidebar({ isCollapsed, onToggleAction }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useGetProfileQuery();
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLSpanElement[]>([]);

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/community", label: "Community", icon: Users },
    { href: "/battle", label: "Battle", icon: Swords },
    { href: "/profile", label: "Profile", icon: User },
  ];

  useGSAP(() => {
    // Animate width
    gsap.to(sidebarRef.current, {
      width: isCollapsed ? 72 : 240,
      duration: 0.4,
      ease: "power2.out",
    });

    // Animate labels
    gsap.to(labelsRef.current, {
      opacity: isCollapsed ? 0 : 1,
      x: isCollapsed ? -10 : 0,
      duration: 0.3,
      ease: "power2.out",
      display: isCollapsed ? "none" : "block",
    });
  }, [isCollapsed]);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        ref={sidebarRef}
        className="flex flex-col h-full bg-sidebar-bg relative border-r border-border-subtle"
        style={{ width: isCollapsed ? 72 : 240 }}
      >
        {/* Sidebar Header - Branding */}
        <div className="h-20 flex items-center px-6 text-text-primary overflow-hidden shrink-0">
          <Link
            href={user ? "/dashboard" : "/"}
            className={cn(
              "flex items-center gap-3 group transition-all duration-300",
              isCollapsed && "mx-auto"
            )}
          >
            <div className="bg-accent/5 p-2 rounded-xl group-hover:bg-accent/10 transition-colors">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-max">
                <span className="font-bold text-lg tracking-tight">AI Teach</span>
                <span className="text-[10px] text-text-secondary font-medium uppercase tracking-[0.2em] -mt-1">
                  Digital Atelier
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            const content = (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group relative",
                  isActive
                    ? "bg-background-base text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-card",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                    isActive && "text-accent"
                  )}
                />
                <span
                  ref={(el) => {
                    if (el) labelsRef.current[index] = el;
                  }}
                  className="tracking-tight whitespace-nowrap"
                  style={{ display: isCollapsed ? "none" : "block", opacity: isCollapsed ? 0 : 1 }}
                >
                  {link.label}
                </span>

                {isActive && !isCollapsed && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={20} className="bg-sidebar-bg text-text-primary border-border-subtle shadow-md">
                    {link.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>

        {/* Sidebar Footer - Profile & Toggle */}
        <div className="mt-auto border-t border-border-subtle shrink-0 bg-sidebar-bg/50 backdrop-blur-sm">
          {user && (
            <div className={cn(
              "p-4 transition-all duration-300",
              isCollapsed ? "flex flex-col items-center gap-4" : "space-y-4"
            )}>
              {/* Profile Info */}
              {!isCollapsed ? (
                <div className="flex items-center gap-3 px-2">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-text-primary truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                      {(user as any).role || "Scholar"}
                    </span>
                  </div>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 cursor-help">
                      <User className="h-5 w-5 text-accent" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-bold">{user.name}</p>
                    <p className="text-[10px] uppercase">{(user as any).role || "Scholar"}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Sign Out Button */}
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "sm"}
                onClick={async () => {
                  try {
                    await signOut().unwrap();
                    router.push("/");
                  } catch (err) {
                    console.error("Failed to sign out", err);
                  }
                }}
                disabled={isSigningOut}
                className={cn(
                  "w-full text-text-secondary hover:text-text-primary transition-colors",
                  isCollapsed ? "h-10 w-10 p-0" : "justify-start gap-3 h-10 px-3"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="font-medium">Sign Out</span>}
              </Button>
            </div>
          )}

          {/* Sidebar Actions & Toggle */}
          <div className="p-2 flex items-center justify-between border-t border-border-subtle/50">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleAction}
              className="text-text-secondary hover:text-text-primary h-8 w-8 transition-colors"
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
