import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, User, Heart, MessageCircle, LogOut, Search } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/interests", label: "Interests", icon: Heart },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function ParivarMark({ className = "h-6 w-6 text-primary" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 4c6 8 12 12 18 14-6 2-12 6-18 26C18 24 12 20 6 18c6-2 12-6 18-14z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="22" r="2.5" fill="currentColor" />
    </svg>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <ParivarMark className="h-7 w-7 shrink-0 text-primary" />
          {!collapsed && (
            <span className="truncate font-serif text-xl font-semibold text-primary">
              Parivar
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => {
                const active = pathname === n.to || pathname.startsWith(n.to + "/");
                return (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                      <Link to={n.to} className="flex items-center gap-2">
                        <n.icon className="h-4 w-4 shrink-0" />
                        <span>{n.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const signOutMobile = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {!isMobile && <AppSidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-card/80 px-3 py-2 backdrop-blur sm:px-6 sm:py-3">
            {isMobile ? (
              <Link to="/dashboard" className="flex items-center gap-2">
                <ParivarMark className="h-6 w-6 text-primary" />
              </Link>
            ) : (
              <SidebarTrigger className="shrink-0" />
            )}
            <div className="min-w-0">
              {title && (
                <h1 className="truncate font-serif text-lg text-primary sm:text-xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="shrink-0">
              {action ?? (isMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOutMobile}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : null)}
            </div>
          </header>
          <main className={cn("min-w-0 flex-1", isMobile && "pb-16")}>{children}</main>
          {isMobile && <MobileBottomNav pathname={pathname} />}
        </div>
      </div>
    </SidebarProvider>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border/60 bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      {NAV.map((n) => {
        const active = pathname === n.to || pathname.startsWith(n.to + "/");
        return (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <n.icon className={cn("h-5 w-5", active && "fill-primary/10")} strokeWidth={active ? 2.5 : 2} />
            <span className="truncate">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { Button };
