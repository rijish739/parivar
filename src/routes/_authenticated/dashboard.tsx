import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMatches, type MatchCandidate } from "@/lib/matching.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppShell } from "@/components/parivar/AppShell";
import {
  Loader2,
  ShieldCheck,
  Heart,
  MapPin,
  User as UserIcon,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home — Parivar" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchMatches = useServerFn(getMatches);
  const [ready, setReady] = useState(false);
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const { data } = await supabase
        .from("profiles_basic")
        .select("onboarding_complete, full_name")
        .eq("user_id", userRes.user.id)
        .maybeSingle();
      if (!data || !data.onboarding_complete) {
        navigate({ to: "/onboarding" });
        return;
      }
      setFirstName((data.full_name ?? "").split(" ")[0] ?? "");
      setReady(true);
    })();
  }, [navigate]);

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => fetchMatches(),
    enabled: ready,
  });

  const sendInterest = useMutation({
    mutationFn: async (receiverId: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Not signed in");
      const { error } = await supabase.from("interests").insert({
        sender_id: userRes.user.id,
        receiver_id: receiverId,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Interest sent");
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ready || isLoading) {
    return (
      <AppShell title="Home">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const featured = (matches ?? []).slice(0, 3);
  const rest = (matches ?? []).slice(3);

  return (
    <AppShell
      title={firstName ? `Namaskara, ${firstName}` : "Namaskara"}
      subtitle="Matches curated from within the community"
      action={
        <Link to="/search">
          <Button variant="outline" size="sm" className="border-gold-soft">
            Advanced search
          </Button>
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Alert className="mb-6 border-gold-soft bg-accent/40">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Testing mode</AlertTitle>
          <AlertDescription>
            Profile verification is currently auto-approved so you can explore the flow.
          </AlertDescription>
        </Alert>

        {featured.length > 0 && (
          <section className="mb-10">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-2xl text-primary">Today's top picks</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {featured.map((m) => (
                <FeaturedCard
                  key={m.user_id}
                  m={m}
                  onSendInterest={() => sendInterest.mutate(m.user_id)}
                  sending={sendInterest.isPending}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-primary">More matches</h2>
            <span className="text-xs text-muted-foreground">
              {matches?.length ?? 0} candidates
            </span>
          </div>

          {rest.length === 0 && featured.length === 0 ? (
            <Card className="border-gold-soft">
              <CardContent className="p-10 text-center text-muted-foreground">
                No matches yet — check back soon as more members join the community.
              </CardContent>
            </Card>
          ) : rest.length === 0 ? null : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rest.map((m) => (
                <MatchCard
                  key={m.user_id}
                  m={m}
                  onSendInterest={() => sendInterest.mutate(m.user_id)}
                  sending={sendInterest.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function FeaturedCard({
  m,
  onSendInterest,
  sending,
}: {
  m: MatchCandidate;
  onSendInterest: () => void;
  sending: boolean;
}) {
  return (
    <Card className="group overflow-hidden border-gold-soft transition-shadow hover:shadow-lg">
      <Link to="/profile/$userId" params={{ userId: m.user_id }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-accent/40">
          {m.photo_url ? (
            <img
              src={m.photo_url}
              alt={m.full_name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <UserIcon className="h-20 w-20" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
            <div className="flex items-baseline justify-between text-white">
              <h3 className="font-serif text-2xl">{m.full_name}</h3>
              {m.age && <span className="text-sm opacity-90">{m.age}</span>}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
              <MapPin className="h-3 w-3" />
              {[m.current_city, m.native_place].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <span className="absolute left-3 top-3 rounded-full bg-gold/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-foreground">
            Top pick
          </span>
        </div>
      </Link>
      <CardContent className="space-y-2 p-4">
        {(m.bari || m.occupation) && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            {[m.bari, m.occupation].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="flex gap-2">
          <Link
            to="/profile/$userId"
            params={{ userId: m.user_id }}
            className="flex-1"
          >
            <Button variant="outline" className="w-full border-gold-soft">
              View
            </Button>
          </Link>
          <Button
            className="flex-1 bg-primary"
            onClick={onSendInterest}
            disabled={sending}
          >
            <Heart className="mr-1 h-4 w-4" /> Interest
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchCard({
  m,
  onSendInterest,
  sending,
}: {
  m: MatchCandidate;
  onSendInterest: () => void;
  sending: boolean;
}) {
  return (
    <Card className="group overflow-hidden border-gold-soft transition-shadow hover:shadow-md">
      <Link to="/profile/$userId" params={{ userId: m.user_id }} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-accent/40">
          {m.photo_url ? (
            <img
              src={m.photo_url}
              alt={m.full_name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <UserIcon className="h-16 w-16" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="space-y-1 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-serif text-lg text-primary">{m.full_name}</h3>
          {m.age && <span className="shrink-0 text-sm text-muted-foreground">{m.age} yrs</span>}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {[m.current_city, m.native_place].filter(Boolean).join(" · ") || "—"}
          </span>
        </p>
        {(m.bari || m.occupation) && (
          <p className="truncate text-xs text-muted-foreground">
            {[m.bari, m.occupation].filter(Boolean).join(" · ")}
          </p>
        )}
        <Button
          size="sm"
          className="mt-2 w-full bg-primary"
          onClick={onSendInterest}
          disabled={sending}
        >
          <Heart className="mr-2 h-4 w-4" /> Send interest
        </Button>
      </CardContent>
    </Card>
  );
}
