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
  User,
  ChevronLeft,
  Menu,
  LogOut,
  Sparkles,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleAction: () => void;
}

// Helper Component for consistent Avatar rendering
const UserAvatar = ({ src }: { src?: string | null }) => (
  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 overflow-hidden shrink-0">
    {src ? (
      <Image
        src={src}
        alt="Profile"
        width={40}
        height={40}
        className="object-cover h-full w-full"
      />
    ) : (
      <User className="h-5 w-5 text-accent" />
    )}
  </div>
);

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
    { href: "/problems", label: "Problems", icon: ScrollText },
  ];

  useGSAP(() => {
    gsap.to(sidebarRef.current, {
      width: isCollapsed ? 72 : 240,
      duration: 0.4,
      ease: "power2.out",
    });

    gsap.to(labelsRef.current, {
      opacity: isCollapsed ? 0 : 1,
      x: isCollapsed ? -10 : 0,
      duration: 0.2,
      ease: "power2.out",
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
              isCollapsed && "mx-auto",
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
                  isCollapsed && "justify-center px-0",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 min-w-5 transition-transform duration-300 group-hover:scale-110",
                    isActive && "text-accent",
                  )}
                />
                <span
                  ref={(el) => {
                    if (el) labelsRef.current[index] = el;
                  }}
                  className={cn(
                    "tracking-tight whitespace-nowrap transition-all duration-200",
                    isCollapsed && "opacity-0 pointer-events-none w-0 overflow-hidden",
                  )}
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
                  <TooltipContent
                    side="right"
                    sideOffset={20}
                    className="bg-sidebar-bg text-text-primary border-border-subtle shadow-md"
                  >
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
            <div
              className={cn(
                "p-4 transition-all duration-300",
                isCollapsed ? "flex flex-col items-center gap-4" : "space-y-4",
              )}
            >
              {/* Profile Info */}
              {!isCollapsed ? (
                <div className="flex items-center gap-3 px-2">
                  <div
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <UserAvatar src={user.profilePic} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-text-primary truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                      {(user as any).role || "Profile"}
                    </span>
                  </div>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => router.push("/profile")}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <UserAvatar src={user.profilePic} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-bold">{user.name}</p>
                    <p className="text-[10px] uppercase">
                      {(user as any).role || "Profile"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Sign Out Button */}
              <Button
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
                  "w-full cursor-pointer",
                  isCollapsed ? "h-10 w-10 p-0" : "justify-start gap-3 h-10 px-3",
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="font-medium">Sign Out</span>}
              </Button>
            </div>
          )}

          {/* Sidebar Actions & Toggle */}
          <div
            className={cn(
              "p-2 flex items-center border-t border-border-subtle/50",
              isCollapsed ? "flex-col gap-4" : "justify-between",
            )}
          >
            <ModeToggle />
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleAction}
              className="h-8 w-8 cursor-pointer"
            >
              {isCollapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}