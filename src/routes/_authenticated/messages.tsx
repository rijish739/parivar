import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/parivar/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, User as UserIcon, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — Parivar" }, { name: "robots", content: "noindex" }] }),
  component: MessagesPage,
});

type MatchItem = {
  otherId: string;
  full_name: string;
  photo_url: string | null;
  last_message?: string;
  last_at?: string;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
};

function MessagesPage() {
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [active, setActive] = useState<MatchItem | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const uid = userRes.user.id;
      setUserId(uid);

      const { data: matchRows } = await supabase
        .from("matches")
        .select("user_a, user_b, created_at")
        .order("created_at", { ascending: false });

      const otherIds = (matchRows ?? []).map((m) => (m.user_a === uid ? m.user_b : m.user_a));
      if (!otherIds.length) {
        setLoading(false);
        return;
      }
      const [{ data: profs }, { data: photos }] = await Promise.all([
        supabase.from("profiles_basic").select("user_id, full_name").in("user_id", otherIds),
        supabase.from("profile_photos").select("user_id, storage_path").in("user_id", otherIds).order("position", { ascending: true }),
      ]);
      const photoPathByUser = new Map<string, string>();
      for (const p of photos ?? []) if (!photoPathByUser.has(p.user_id)) photoPathByUser.set(p.user_id, p.storage_path);
      const paths = Array.from(photoPathByUser.values());
      const signedByPath = new Map<string, string>();
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrls(paths, 3600);
        for (const s of signed ?? []) if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
      }
      const items: MatchItem[] = otherIds.map((id) => {
        const p = profs?.find((x) => x.user_id === id);
        const path = photoPathByUser.get(id);
        return {
          otherId: id,
          full_name: p?.full_name ?? "Member",
          photo_url: path ? signedByPath.get(path) ?? null : null,
        };
      });
      setMatches(items);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <AppShell title="Messages">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Messages" subtitle="Chats with your accepted matches">
      <div className="mx-auto w-full max-w-6xl px-0 sm:px-6 sm:py-6">
        {matches.length === 0 ? (
          <div className="px-4 py-6 sm:px-0">
            <Card className="border-gold-soft">
              <CardContent className="p-10 text-center text-muted-foreground">
                No matches yet. Accept an interest to start a conversation.
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-none border-y border-gold-soft bg-card sm:h-[75vh] sm:rounded-xl sm:border">
            <div className="grid h-full grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
              {/* Conversation list */}
              <aside
                className={cn(
                  "flex flex-col border-r border-border/60",
                  active ? "hidden md:flex" : "flex",
                )}
              >
                <div className="border-b border-border/60 px-4 py-3">
                  <h2 className="font-serif text-lg text-primary">Chats</h2>
                  <p className="text-xs text-muted-foreground">
                    {matches.length} accepted match{matches.length === 1 ? "" : "es"}
                  </p>
                </div>
                <ul className="flex-1 divide-y divide-border/40 overflow-y-auto">
                  {matches.map((m) => (
                    <li key={m.otherId}>
                      <button
                        onClick={() => setActive(m)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                          active?.otherId === m.otherId ? "bg-accent" : "hover:bg-accent/60",
                        )}
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold-soft bg-accent/40">
                          {m.photo_url ? (
                            <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <UserIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-base text-primary">{m.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            Say hello and start the conversation
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              {/* Chat panel */}
              <section className={cn("flex flex-col", !active && "hidden md:flex")}>
                {active ? (
                  <ChatPanel userId={userId} other={active} onBack={() => setActive(null)} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                    <ShieldCheck className="h-10 w-10 text-gold" />
                    <p className="max-w-xs font-serif text-lg text-primary">Select a chat to begin</p>
                    <p className="max-w-xs text-sm">
                      Messages remain private between you and your accepted match.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ChatPanel({
  userId,
  other,
  onBack,
}: {
  userId: string;
  other: MatchItem;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, body, created_at")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${other.otherId}),and(sender_id.eq.${other.otherId},receiver_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
  }, [userId, other.otherId]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`chat:${userId}:${other.otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          if (
            (m.sender_id === userId && m.receiver_id === other.otherId) ||
            (m.sender_id === other.otherId && m.receiver_id === userId)
          ) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, other.otherId, load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const body = text.trim();
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: userId, receiver_id: other.otherId, body });
    setSending(false);
    if (error) setText(body);
  };

  return (
    <>
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-border/60 px-3 py-2 sm:px-4 sm:py-3">
        <button onClick={onBack} className="shrink-0 md:hidden">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gold-soft bg-accent/40">
            {other.photo_url ? (
              <img src={other.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-lg text-primary">{other.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">Accepted match</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Say hello — start the conversation warmly.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-accent text-foreground",
                )}
              >
                {m.body}
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="flex gap-2 border-t border-border/60 bg-card p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" className="bg-primary" disabled={sending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </>
  );
}
