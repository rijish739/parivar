import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, LogOut, Check, X, Trash2, RefreshCw } from "lucide-react";
import {
  adminCheckPassword,
  adminListProfiles,
  adminSetVerified,
  adminDeleteProfile,
  type PendingProfile,
} from "@/lib/admin.functions";

const STORAGE_KEY = "parivar_admin_pw";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Parivar" },
      { name: "description", content: "Community admin review for Parivar profiles." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function calcAge(dob: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");
  const [refreshing, setRefreshing] = useState(false);

  const check = useServerFn(adminCheckPassword);
  const list = useServerFn(adminListProfiles);
  const setVerified = useServerFn(adminSetVerified);
  const remove = useServerFn(adminDeleteProfile);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setPassword(saved);
  }, []);

  useEffect(() => {
    if (!password) return;
    void loadProfiles(password, filter);
  }, [password, filter]);

  async function loadProfiles(pw: string, f: typeof filter) {
    setRefreshing(true);
    try {
      const rows = await list({ data: { password: pw, filter: f } });
      setProfiles(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
      if ((e as Error).message === "Unauthorized") signOut();
    } finally {
      setRefreshing(false);
    }
  }

  async function submitPassword() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { ok } = await check({ data: { password: input } });
      if (!ok) {
        toast.error("Incorrect password");
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, input);
      setPassword(input);
      setInput("");
    } catch {
      toast.error("Could not verify password");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword(null);
    setProfiles([]);
  }

  async function verifyOne(userId: string, verified: boolean) {
    if (!password) return;
    try {
      await setVerified({ data: { password, userId, verified } });
      toast.success(verified ? "Profile approved" : "Verification revoked");
      void loadProfiles(password, filter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function deleteOne(userId: string) {
    if (!password) return;
    if (!confirm("Delete this profile? This cannot be undone.")) return;
    try {
      await remove({ data: { password, userId } });
      toast.success("Profile removed");
      void loadProfiles(password, filter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (!password) {
    return (
      <div className="min-h-screen bg-hero-warm">
        <div className="mx-auto max-w-md px-4 py-16">
          <Card className="border-gold-soft">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl text-primary">Community Admin</CardTitle>
              <CardDescription>
                Enter the admin password shared with your committee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">Admin password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <Button className="w-full" onClick={submitPassword} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enter admin panel
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Only authorised community members should access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h1 className="font-serif text-lg text-primary">Admin Review</h1>
              <p className="text-xs text-muted-foreground">Approve profiles before they go live</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => loadProfiles(password, filter)} disabled={refreshing}>
              <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl gap-2 px-4 pb-3">
          {(["pending", "verified", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {refreshing && profiles.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {filter === "all" ? "" : filter} profiles.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {profiles.map((p) => {
              const age = calcAge(p.date_of_birth);
              return (
                <Card key={p.user_id} className="border-border/60">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-lg text-primary">
                          {p.full_name ?? "Unnamed"}
                        </h3>
                        {p.is_verified ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Verified</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        {!p.onboarding_complete && (
                          <Badge variant="secondary">Incomplete</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[p.gender, age ? `${age} yrs` : null, p.marital_status, p.height_cm ? `${p.height_cm} cm` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[p.current_city, p.native_place, p.mother_tongue].filter(Boolean).join(" · ") || "No location details"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Submitted {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.is_verified ? (
                        <Button size="sm" variant="outline" onClick={() => verifyOne(p.user_id, false)}>
                          <X className="mr-1 h-4 w-4" /> Revoke
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => verifyOne(p.user_id, true)}>
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteOne(p.user_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
