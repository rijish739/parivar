import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/parivar/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  User as UserIcon,
  MapPin,
  Pencil,
  ShieldCheck,
  LogOut,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — Parivar" }, { name: "robots", content: "noindex" }] }),
  component: MyProfile,
});

type Data = {
  basic: {
    full_name: string;
    date_of_birth: string;
    gender: string;
    height_cm: number | null;
    weight_kg: number | null;
    marital_status: string;
    mother_tongue: string | null;
    current_city: string | null;
    native_place: string | null;
    is_verified: boolean;
    onboarding_complete: boolean;
  } | null;
  community: { bari: string | null; family_deity: string | null; gotra: string | null; family_background: string | null } | null;
  career: { highest_qualification: string | null; field_of_study: string | null; occupation: string | null; company: string | null; annual_income: string | null } | null;
  family: { father_occupation: string | null; mother_occupation: string | null; siblings_married: number | null; siblings_unmarried: number | null; family_type: string | null; family_values: string | null } | null;
  lifestyle: { diet: string | null; smoking: boolean | null; drinking: boolean | null; hobbies: string[] | null } | null;
  horoscope: { provided: boolean | null; birth_date: string | null; birth_time: string | null; birth_place: string | null; rashi: string | null; nakshatra: string | null; manglik: string | null; matching_required: boolean | null } | null;
  prefs: { age_min: number | null; age_max: number | null; height_min_cm: number | null; height_max_cm: number | null; location_pref: string | null; diet_pref: string | null; bari_pref: string | null; income_pref: string | null; education_pref: string | null } | null;
  privacy: { profile_visibility: string | null; photo_visibility: string | null } | null;
  photoUrls: string[];
};

function MyProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) return;

    const [b, c, ca, fa, li, ho, pr, pv, ph] = await Promise.all([
      supabase.from("profiles_basic").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("community_details").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("education_career").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("family_details").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("lifestyle").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("horoscope").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("partner_preferences").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("privacy_settings").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("profile_photos").select("storage_path").eq("user_id", uid).order("position", { ascending: true }),
    ]);

    const paths = (ph.data ?? []).map((x) => x.storage_path);
    let photoUrls: string[] = [];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrls(paths, 3600);
      photoUrls = (signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[];
    }

    setData({
      basic: b.data,
      community: c.data,
      career: ca.data,
      family: fa.data,
      lifestyle: li.data,
      horoscope: ho.data,
      prefs: pr.data,
      privacy: pv.data,
      photoUrls,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  const completion = useMemo(() => computeCompletion(data), [data]);

  if (loading) {
    return (
      <AppShell title="My profile">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const b = data?.basic;
  if (!b) {
    return (
      <AppShell title="My profile">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center">
          <p className="text-muted-foreground">Your profile isn't set up yet.</p>
          <Link to="/onboarding" className="mt-4 inline-block">
            <Button className="bg-primary">Complete profile</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const age = b.date_of_birth
    ? Math.floor((Date.now() - new Date(b.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <AppShell
      title="My profile"
      subtitle="How other members see you"
      action={
        <div className="flex gap-2">
          <Link to="/onboarding">
            <Button variant="outline" size="sm" className="border-gold-soft">
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {/* Completion banner */}
        {completion.percent < 100 && (
          <Card className="mb-6 border-gold-soft bg-accent/30">
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-lg text-primary">
                    Profile {completion.percent}% complete
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {completion.nextStep
                      ? `Next: add your ${completion.nextStep} to attract better matches.`
                      : "Complete every section for the strongest matches."}
                  </p>
                  <Progress value={completion.percent} className="mt-3 h-2" />
                </div>
                <Link to="/onboarding" className="shrink-0">
                  <Button size="sm" className="bg-primary">Continue</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
          {/* Photo + summary rail */}
          <aside className="space-y-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-gold-soft bg-accent/30">
              {data?.photoUrls[0] ? (
                <img src={data.photoUrls[0]} alt={b.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                  <UserIcon className="h-20 w-20 text-muted-foreground" />
                  <Link to="/onboarding">
                    <Button size="sm" variant="outline" className="border-gold-soft">
                      <Camera className="mr-1 h-4 w-4" /> Add photo
                    </Button>
                  </Link>
                </div>
              )}
              {b.is_verified && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>

            {data && data.photoUrls.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {data.photoUrls.slice(1, 7).map((u, i) => (
                  <img key={i} src={u} alt="" className="aspect-square rounded-md object-cover" />
                ))}
              </div>
            )}

            <Card className="border-gold-soft">
              <CardContent className="p-4">
                <h2 className="truncate font-serif text-2xl text-primary">{b.full_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[age && `${age} yrs`, b.height_cm && `${b.height_cm} cm`, cap(b.marital_status)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {[b.current_city, b.native_place].filter(Boolean).join(" · ") || "—"}
                  </span>
                </p>
              </CardContent>
            </Card>
          </aside>

          {/* Details */}
          <div className="space-y-4">
            <Section title="Basic details" href="/onboarding">
              <Row label="Gender" value={cap(b.gender)} />
              <Row label="Date of birth" value={b.date_of_birth} />
              <Row label="Height" value={b.height_cm ? `${b.height_cm} cm` : null} />
              <Row label="Weight" value={b.weight_kg ? `${b.weight_kg} kg` : null} />
              <Row label="Mother tongue" value={b.mother_tongue} />
              <Row label="Marital status" value={cap(b.marital_status)} />
            </Section>

            <Section title="Community" href="/onboarding">
              <Row label="Sub-division / Bari" value={data?.community?.bari} />
              <Row label="Family deity" value={data?.community?.family_deity} />
              <Row label="Gotra" value={data?.community?.gotra} />
              <Row label="Family background" value={cap(data?.community?.family_background)} />
            </Section>

            <Section title="Education & career" href="/onboarding">
              <Row label="Qualification" value={data?.career?.highest_qualification} />
              <Row label="Field" value={data?.career?.field_of_study} />
              <Row label="Occupation" value={data?.career?.occupation} />
              <Row label="Company" value={data?.career?.company} />
              <Row label="Income" value={cap(data?.career?.annual_income)} />
            </Section>

            <Section title="Family" href="/onboarding">
              <Row label="Father's occupation" value={data?.family?.father_occupation} />
              <Row label="Mother's occupation" value={data?.family?.mother_occupation} />
              <Row label="Siblings married" value={data?.family?.siblings_married?.toString()} />
              <Row label="Siblings unmarried" value={data?.family?.siblings_unmarried?.toString()} />
              <Row label="Family type" value={cap(data?.family?.family_type)} />
              <Row label="Family values" value={cap(data?.family?.family_values)} />
            </Section>

            <Section title="Lifestyle" href="/onboarding">
              <Row label="Diet" value={cap(data?.lifestyle?.diet)} />
              <Row label="Smoking" value={boolLabel(data?.lifestyle?.smoking)} />
              <Row label="Drinking" value={boolLabel(data?.lifestyle?.drinking)} />
              <Row label="Hobbies" value={data?.lifestyle?.hobbies?.join(", ") || null} />
            </Section>

            {data?.horoscope?.provided && (
              <Section title="Horoscope" href="/onboarding">
                <Row label="Birth date" value={data.horoscope.birth_date} />
                <Row label="Birth time" value={data.horoscope.birth_time} />
                <Row label="Birth place" value={data.horoscope.birth_place} />
                <Row label="Rashi" value={data.horoscope.rashi} />
                <Row label="Nakshatra" value={data.horoscope.nakshatra} />
                <Row label="Manglik" value={cap(data.horoscope.manglik)} />
                <Row label="Matching required" value={boolLabel(data.horoscope.matching_required)} />
              </Section>
            )}

            <Section title="Partner preferences" href="/onboarding">
              <Row
                label="Age"
                value={
                  data?.prefs?.age_min || data?.prefs?.age_max
                    ? `${data?.prefs?.age_min ?? "?"} – ${data?.prefs?.age_max ?? "?"} yrs`
                    : null
                }
              />
              <Row
                label="Height"
                value={
                  data?.prefs?.height_min_cm || data?.prefs?.height_max_cm
                    ? `${data?.prefs?.height_min_cm ?? "?"} – ${data?.prefs?.height_max_cm ?? "?"} cm`
                    : null
                }
              />
              <Row label="Location" value={cap(data?.prefs?.location_pref)} />
              <Row label="Diet" value={cap(data?.prefs?.diet_pref)} />
              <Row label="Sub-division" value={data?.prefs?.bari_pref} />
              <Row label="Income" value={cap(data?.prefs?.income_pref)} />
              <Row label="Education" value={data?.prefs?.education_pref} />
            </Section>

            <Section title="Privacy" href="/onboarding">
              <Row label="Profile visibility" value={cap(data?.privacy?.profile_visibility)} />
              <Row label="Photo visibility" value={cap(data?.privacy?.photo_visibility)} />
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function computeCompletion(data: Data | null): { percent: number; nextStep: string | null } {
  if (!data) return { percent: 0, nextStep: "basic details" };
  const checks: [string, boolean][] = [
    ["basic details", !!data.basic?.full_name],
    ["community details", !!data.community?.bari],
    ["education & career", !!data.career?.occupation],
    ["family details", !!data.family?.father_occupation || !!data.family?.mother_occupation],
    ["lifestyle", !!data.lifestyle?.diet],
    ["partner preferences", !!data.prefs?.age_min],
    ["profile photos", (data.photoUrls?.length ?? 0) > 0],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  const percent = Math.round((done / checks.length) * 100);
  const next = checks.find(([, ok]) => !ok)?.[0] ?? null;
  return { percent, nextStep: next };
}

function cap(v: string | null | undefined) {
  if (!v) return null;
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function boolLabel(v: boolean | null | undefined) {
  if (v == null) return null;
  return v ? "Yes" : "No";
}

function Section({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <Card className="border-gold-soft">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg text-primary">{title}</h3>
          {href && (
            <Link to={href} className="text-xs text-muted-foreground hover:text-foreground">
              <Pencil className="inline h-3 w-3" /> Edit
            </Link>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-6">{children}</dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="text-sm">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
