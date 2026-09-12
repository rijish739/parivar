import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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
      <path d="M24 4c6 8 12 12 18 14-6 2-12 6-18 26C18 24 12 20 6 18c6-2 12-6 18-14z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="24" cy="22" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function AppShell({ children, title, subtitle, action }: { children: ReactNode; title?: string; subtitle?: string; action?: ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); };
  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobile && <aside className="hidden w-60 border-r border-border bg-card md:block"><div className="p-5"><Link to="/dashboard" className="flex items-center gap-2"><ParivarMark className="h-7 w-7 text-primary" /><span className="font-serif text-xl font-semibold text-primary">Parivar</span></Link></div><nav className="space-y-1 px-3">{NAV.map((n) => <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm", pathname.startsWith(n.to) ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground")}><n.icon className="h-4 w-4" />{n.label}</Link>)}</nav><Button variant="ghost" className="m-3 w-[calc(100%-1.5rem)] justify-start" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></aside>}
      <div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-card/90 px-4 py-3 backdrop-blur"><Link to="/dashboard" className="flex items-center gap-2 md:hidden"><ParivarMark className="h-6 w-6 text-primary" /></Link><div className="min-w-0">{title && <h1 className="truncate font-serif text-xl text-primary">{title}</h1>}{subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}</div><div>{action ?? <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>}</div></header><main className={cn("min-w-0 flex-1", isMobile && "pb-16")}>{children}</main>{isMobile && <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)]">{NAV.map((n) => <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-1 py-2 text-[10px]", pathname.startsWith(n.to) ? "text-primary" : "text-muted-foreground")}><n.icon className="h-5 w-5" /><span>{n.label}</span></Link>)}</nav>}</div>
    </div>
  );
}
