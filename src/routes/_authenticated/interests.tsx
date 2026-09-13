import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/parivar/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  X,
  User as UserIcon,
  MapPin,
  MessageCircle,
  Inbox,
  Send as SendIcon,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/interests")({
  head: () => ({ meta: [{ title: "Interests — Parivar" }, { name: "robots", content: "noindex" }] }),
  component: InterestsPage,
});

type InterestRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  other: { user_id: string; full_name: string; current_city: string | null; photo_url: string | null } | null;
};

function InterestsPage() {
  const [loading, setLoading] = useState(true);
  const [received, setReceived] = useState<InterestRow[]>([]);
  const [sent, setSent] = useState<InterestRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    const uid = userRes.user.id;

    const { data: rows } = await supabase
      .from("interests")
      .select("id, sender_id, receiver_id, status, created_at")
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    const otherIds = Array.from(
      new Set((rows ?? []).map((r) => (r.sender_id === uid ? r.receiver_id : r.sender_id))),
    );

    const profileMap = new Map<string, { full_name: string; current_city: string | null }>();
    const photoPathByUser = new Map<string, string>();
    if (otherIds.length) {
      const [{ data: profs }, { data: photos }] = await Promise.all([
        supabase.from("profiles_basic").select("user_id, full_name, current_city").in("user_id", otherIds),
        supabase.from("profile_photos").select("user_id, storage_path").in("user_id", otherIds).order("position", { ascending: true }),
      ]);
      for (const p of profs ?? []) profileMap.set(p.user_id, { full_name: p.full_name, current_city: p.current_city });
      for (const p of photos ?? []) if (!photoPathByUser.has(p.user_id)) photoPathByUser.set(p.user_id, p.storage_path);
    }
    const paths = Array.from(photoPathByUser.values());
    const signedByPath = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrls(paths, 3600);
      for (const s of signed ?? []) if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
    }

    const enriched: InterestRow[] = (rows ?? []).map((r) => {
      const otherId = r.sender_id === uid ? r.receiver_id : r.sender_id;
      const p = profileMap.get(otherId);
      const path = photoPathByUser.get(otherId);
      return {
        ...r,
        status: r.status as InterestRow["status"],
        other: p
          ? { user_id: otherId, full_name: p.full_name, current_city: p.current_city, photo_url: path ? signedByPath.get(path) ?? null : null }
          : null,
      };
    });

    setReceived(enriched.filter((r) => r.receiver_id === uid));
    setSent(enriched.filter((r) => r.sender_id === uid));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("interests").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "accepted" ? "Interest accepted — you can now chat" : "Declined");
    load();
  };

  const withdraw = async (id: string) => {
    const { error } = await supabase.from("interests").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Interest withdrawn");
    load();
  };

  const receivedPending = useMemo(() => received.filter((r) => r.status === "pending"), [received]);
  const accepted = useMemo(
    () => [...received, ...sent].filter((r) => r.status === "accepted"),
    [received, sent],
  );

  if (loading) {
    return (
      <AppShell title="Interests">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Interests" subtitle="Respond, review, and connect">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received" className="gap-2">
              <Inbox className="h-4 w-4" />
              <span>Received</span>
              {receivedPending.length > 0 && (
                <Badge className="ml-1 h-5 min-w-5 rounded-full bg-primary px-1 text-primary-foreground">
                  {receivedPending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <SendIcon className="h-4 w-4" /> Sent
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              <HeartHandshake className="h-4 w-4" /> Accepted
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6 space-y-3">
            {received.length === 0 && <Empty text="No interests received yet. Complete your profile and add photos to attract better matches." />}
            {received.map((r) => (
              <InterestCard key={r.id} row={r}>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respond(r.id, "accepted")} className="bg-primary">
                      <Check className="mr-1 h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond(r.id, "declined")}>
                      <X className="mr-1 h-4 w-4" /> Decline
                    </Button>
                  </div>
                ) : r.status === "accepted" ? (
                  <Link to="/messages">
                    <Button size="sm" variant="outline" className="border-gold-soft">
                      <MessageCircle className="mr-1 h-4 w-4" /> Message
                    </Button>
                  </Link>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </InterestCard>
            ))}
          </TabsContent>

          <TabsContent value="sent" className="mt-6 space-y-3">
            {sent.length === 0 && <Empty text="You haven't sent any interests yet. Browse matches to get started." />}
            {sent.map((r) => (
              <InterestCard key={r.id} row={r}>
                {r.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <Button size="sm" variant="ghost" onClick={() => withdraw(r.id)}>
                      Withdraw
                    </Button>
                  </div>
                ) : r.status === "accepted" ? (
                  <Link to="/messages">
                    <Button size="sm" variant="outline" className="border-gold-soft">
                      <MessageCircle className="mr-1 h-4 w-4" /> Message
                    </Button>
                  </Link>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </InterestCard>
            ))}
          </TabsContent>

          <TabsContent value="accepted" className="mt-6 space-y-3">
            {accepted.length === 0 && <Empty text="No accepted matches yet. Accepted interests unlock messaging." />}
            {accepted.map((r) => (
              <InterestCard key={r.id} row={r}>
                <Link to="/messages">
                  <Button size="sm" className="bg-primary">
                    <MessageCircle className="mr-1 h-4 w-4" /> Message
                  </Button>
                </Link>
              </InterestCard>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="border-gold-soft">
      <CardContent className="p-10 text-center text-muted-foreground">{text}</CardContent>
    </Card>
  );
}

function InterestCard({ row, children }: { row: InterestRow; children: React.ReactNode }) {
  return (
    <Card className="border-gold-soft transition-shadow hover:shadow-sm">
      <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4">
        <Link to="/profile/$userId" params={{ userId: row.other?.user_id ?? "" }} className="shrink-0">
          <div className="h-14 w-14 overflow-hidden rounded-full border border-gold-soft bg-accent/40">
            {row.other?.photo_url ? (
              <img src={row.other.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserIcon className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>
        </Link>
        <div className="min-w-0">
          <Link to="/profile/$userId" params={{ userId: row.other?.user_id ?? "" }}>
            <p className="truncate font-serif text-lg text-primary hover:underline">
              {row.other?.full_name ?? "—"}
            </p>
          </Link>
          {row.other?.current_city && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{row.other.current_city}</span>
            </p>
          )}
        </div>
        <div className="shrink-0">{children}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: InterestRow["status"] }) {
  const cls = {
    pending: "bg-muted text-muted-foreground",
    accepted: "bg-primary/10 text-primary",
    declined: "bg-destructive/10 text-destructive",
  }[status];
  return <span className={`rounded-full px-3 py-1 text-xs capitalize ${cls}`}>{status}</span>;
}
