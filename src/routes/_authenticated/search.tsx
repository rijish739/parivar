import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/parivar/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Search as SearchIcon, MapPin, User as UserIcon, RotateCcw, SlidersHorizontal, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — Parivar" }, { name: "robots", content: "noindex" }] }),
  component: SearchPage,
});

type Result = {
  user_id: string;
  full_name: string;
  age: number | null;
  height_cm: number | null;
  current_city: string | null;
  native_place: string | null;
  marital_status: string | null;
  bari: string | null;
  occupation: string | null;
  diet: string | null;
  photo_url: string | null;
};

type Filters = {
  q: string;
  gender: "any" | "male" | "female";
  ageMin: string;
  ageMax: string;
  city: string;
  bari: string;
  marital: "any" | "never_married" | "divorced" | "widowed";
  diet: "any" | "veg" | "non_veg" | "eggetarian";
};

const defaultFilters: Filters = {
  q: "",
  gender: "any",
  ageMin: "",
  ageMax: "",
  city: "",
  bari: "",
  marital: "any",
  diet: "any",
};

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function SearchPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [meId, setMeId] = useState<string>("");
  const [myGender, setMyGender] = useState<string>("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (userRes.user) {
        setMeId(userRes.user.id);
        const { data } = await supabase
          .from("profiles_basic")
          .select("gender")
          .eq("user_id", userRes.user.id)
          .maybeSingle();
        const g = data?.gender ?? "";
        setMyGender(g);
        const initial = { ...defaultFilters, gender: (g === "male" ? "female" : g === "female" ? "male" : "any") as Filters["gender"] };
        setFilters(initial);
        setApplied(initial);
      }
      setInitialised(true);
    })();
  }, []);

  useEffect(() => {
    if (!initialised || !meId) return;
    void runSearch(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, initialised, meId]);

  const runSearch = async (f: Filters) => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles_basic")
        .select(
          "user_id, full_name, date_of_birth, height_cm, current_city, native_place, marital_status, gender, is_verified",
        )
        .eq("is_verified", true)
        .eq("onboarding_complete", true)
        .neq("user_id", meId)
        .limit(60);

      if (f.gender !== "any") query = query.eq("gender", f.gender);
      if (f.marital !== "any") query = query.eq("marital_status", f.marital);
      if (f.city.trim()) query = query.ilike("current_city", `%${f.city.trim()}%`);
      if (f.q.trim()) query = query.ilike("full_name", `%${f.q.trim()}%`);

      if (f.ageMin) {
        const max = new Date();
        max.setFullYear(max.getFullYear() - Number(f.ageMin));
        query = query.lte("date_of_birth", max.toISOString().slice(0, 10));
      }
      if (f.ageMax) {
        const min = new Date();
        min.setFullYear(min.getFullYear() - Number(f.ageMax) - 1);
        query = query.gte("date_of_birth", min.toISOString().slice(0, 10));
      }

      const { data: rows, error } = await query;
      if (error) throw error;
      let list = rows ?? [];

      const ids = list.map((r) => r.user_id);
      if (!ids.length) {
        setResults([]);
        return;
      }

      const [{ data: comm }, { data: career }, { data: life }, { data: photos }] = await Promise.all([
        supabase.from("community_details").select("user_id, bari").in("user_id", ids),
        supabase.from("education_career").select("user_id, occupation").in("user_id", ids),
        supabase.from("lifestyle").select("user_id, diet").in("user_id", ids),
        supabase
          .from("profile_photos")
          .select("user_id, storage_path, position")
          .in("user_id", ids)
          .order("position", { ascending: true }),
      ]);

      const bariBy = new Map(comm?.map((c) => [c.user_id, c.bari]) ?? []);
      const occBy = new Map(career?.map((c) => [c.user_id, c.occupation]) ?? []);
      const dietBy = new Map(life?.map((l) => [l.user_id, l.diet]) ?? []);
      const photoBy = new Map<string, string>();
      for (const p of photos ?? []) if (!photoBy.has(p.user_id)) photoBy.set(p.user_id, p.storage_path);

      if (f.bari.trim()) {
        list = list.filter((r) => (bariBy.get(r.user_id) ?? "").toLowerCase().includes(f.bari.trim().toLowerCase()));
      }
      if (f.diet !== "any") {
        list = list.filter((r) => dietBy.get(r.user_id) === f.diet);
      }

      const paths = list.map((r) => photoBy.get(r.user_id)).filter(Boolean) as string[];
      const signedBy = new Map<string, string>();
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrls(paths, 3600);
        for (const s of signed ?? []) if (s.signedUrl && s.path) signedBy.set(s.path, s.signedUrl);
      }

      setResults(
        list.map((r) => {
          const path = photoBy.get(r.user_id);
          return {
            user_id: r.user_id,
            full_name: r.full_name,
            age: ageFromDob(r.date_of_birth),
            height_cm: r.height_cm,
            current_city: r.current_city,
            native_place: r.native_place,
            marital_status: r.marital_status,
            bari: bariBy.get(r.user_id) ?? null,
            occupation: occBy.get(r.user_id) ?? null,
            diet: dietBy.get(r.user_id) ?? null,
            photo_url: path ? signedBy.get(path) ?? null : null,
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const reset = () => {
    const r = { ...defaultFilters, gender: (myGender === "male" ? "female" : myGender === "female" ? "male" : "any") as Filters["gender"] };
    setFilters(r);
    setApplied(r);
  };

  const apply = () => {
    setApplied(filters);
    setMobileFiltersOpen(false);
  };

  const activeCount = useMemo(
    () =>
      Object.entries(applied).filter(([k, v]) => {
        const dv = (defaultFilters as Record<string, unknown>)[k];
        return v !== dv && v !== "" && v !== "any";
      }).length,
    [applied],
  );

  const filterPanel = (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</Label>
        <Input placeholder="Search by name…" value={filters.q} onChange={(e) => set("q", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Looking for</Label>
        <Select value={filters.gender} onValueChange={(v) => set("gender", v as Filters["gender"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="female">Bride</SelectItem>
            <SelectItem value="male">Groom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Age range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min={18} max={80} placeholder="Min" value={filters.ageMin} onChange={(e) => set("ageMin", e.target.value)} />
          <Input type="number" min={18} max={80} placeholder="Max" value={filters.ageMax} onChange={(e) => set("ageMax", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marital status</Label>
        <Select value={filters.marital} onValueChange={(v) => set("marital", v as Filters["marital"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="never_married">Never married</SelectItem>
            <SelectItem value="divorced">Divorced</SelectItem>
            <SelectItem value="widowed">Widowed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</Label>
        <Input placeholder="e.g. Mangalore" value={filters.city} onChange={(e) => set("city", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sub-division / Bari</Label>
        <Input placeholder="e.g. Bangera" value={filters.bari} onChange={(e) => set("bari", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diet</Label>
        <Select value={filters.diet} onValueChange={(v) => set("diet", v as Filters["diet"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="veg">Vegetarian</SelectItem>
            <SelectItem value="non_veg">Non-vegetarian</SelectItem>
            <SelectItem value="eggetarian">Eggetarian</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-primary">
          <SearchIcon className="mr-2 h-4 w-4" /> Apply
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );

  return (
    <AppShell
      title="Find a match"
      subtitle="Refine by community, city, and lifestyle"
      action={
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <Badge className="ml-2 h-5 min-w-5 rounded-full bg-primary px-1 text-primary-foreground">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-serif text-primary">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{filterPanel}</div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <Card className="sticky top-20 border-gold-soft">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-serif text-lg text-primary">Filters</h2>
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
                {filterPanel}
              </CardContent>
            </Card>
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? "Searching…" : `${results.length} member${results.length === 1 ? "" : "s"} found`}
              </p>
              {activeCount > 0 && (
                <Badge variant="secondary" className="lg:hidden">
                  {activeCount} filter{activeCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-[30vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <Card className="border-gold-soft">
                <CardContent className="p-10 text-center text-muted-foreground">
                  No members match these filters. Try broadening your search.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((r) => (
                  <ResultCard key={r.user_id} r={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ResultCard({ r }: { r: Result }) {
  return (
    <Card className="group overflow-hidden border-gold-soft transition-shadow hover:shadow-md">
      <Link to="/profile/$userId" params={{ userId: r.user_id }} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-accent/40">
          {r.photo_url ? (
            <img
              src={r.photo_url}
              alt={r.full_name}
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
          <h3 className="truncate font-serif text-lg text-primary">{r.full_name}</h3>
          {r.age && <span className="shrink-0 text-sm text-muted-foreground">{r.age} yrs</span>}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{[r.current_city, r.native_place].filter(Boolean).join(" · ") || "—"}</span>
        </p>
        {(r.bari || r.occupation) && (
          <p className="truncate text-xs text-muted-foreground">
            {[r.bari, r.occupation].filter(Boolean).join(" · ")}
          </p>
        )}
        <Link to="/profile/$userId" params={{ userId: r.user_id }}>
          <Button variant="outline" size="sm" className="mt-3 w-full border-gold-soft">
            View profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
