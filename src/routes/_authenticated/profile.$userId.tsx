import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/parivar/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User as UserIcon, MapPin, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  head: () => ({ meta: [{ title: "Profile — Parivar" }, { name: "robots", content: "noindex" }] }),
  component: ProfileDetail,
});

type FullProfile = {
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
  } | null;
  community: { bari: string | null; family_deity: string | null; gotra: string | null; family_background: string | null } | null;
  career: { highest_qualification: string | null; field_of_study: string | null; occupation: string | null; company: string | null; annual_income: string | null } | null;
  lifestyle: { diet: string | null; smoking: boolean | null; drinking: boolean | null; hobbies: string[] | null } | null;
  photoUrls: string[];
};

function ProfileDetail() {
  const { userId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FullProfile | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [basicR, commR, carR, lifeR, photoR] = await Promise.all([
        supabase.from("profiles_basic").select("full_name,date_of_birth,gender,height_cm,weight_kg,marital_status,mother_tongue,current_city,native_place").eq("user_id", userId).maybeSingle(),
        supabase.from("community_details").select("bari,family_deity,gotra,family_background").eq("user_id", userId).maybeSingle(),
        supabase.from("education_career").select("highest_qualification,field_of_study,occupation,company,annual_income").eq("user_id", userId).maybeSingle(),
        supabase.from("lifestyle").select("diet,smoking,drinking,hobbies").eq("user_id", userId).maybeSingle(),
        supabase.from("profile_photos").select("storage_path").eq("user_id", userId).order("position", { ascending: true }),
      ]);
      const paths = (photoR.data ?? []).map((p) => p.storage_path);
      let photoUrls: string[] = [];
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrls(paths, 3600);
        photoUrls = (signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[];
      }
      setData({
        basic: basicR.data,
        community: commR.data,
        career: carR.data,
        lifestyle: lifeR.data,
        photoUrls,
      });
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!data?.basic) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-8 text-center">
          <p className="text-muted-foreground">This profile is not available.</p>
          <Link to="/dashboard" className="mt-4 inline-block">
            <Button variant="outline">Back to matches</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const b = data.basic;
  const age = b.date_of_birth
    ? Math.floor((Date.now() - new Date(b.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <div className="aspect-[4/5] overflow-hidden rounded-lg border border-gold-soft bg-accent/30">
              {data.photoUrls[0] ? (
                <img src={data.photoUrls[0]} alt={b.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon className="h-20 w-20 text-muted-foreground" />
                </div>
              )}
            </div>
            {data.photoUrls.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {data.photoUrls.slice(1).map((u, i) => (
                  <img key={i} src={u} alt="" className="aspect-square rounded object-cover" />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl text-primary">{b.full_name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {[age && `${age} yrs`, b.height_cm && `${b.height_cm} cm`, b.marital_status?.replace("_", " ")].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[b.current_city, b.native_place].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>

            <Section title="Community">
              <Row label="Sub-division / Bari" value={data.community?.bari} />
              <Row label="Family deity" value={data.community?.family_deity} />
              <Row label="Gotra" value={data.community?.gotra} />
              <Row label="Family background" value={data.community?.family_background} />
            </Section>

            <Section title="Education & career">
              <Row label="Qualification" value={data.career?.highest_qualification} />
              <Row label="Field" value={data.career?.field_of_study} />
              <Row label="Occupation" value={data.career?.occupation} />
              <Row label="Company" value={data.career?.company} />
              <Row label="Income" value={data.career?.annual_income} />
            </Section>

            <Section title="Lifestyle">
              <Row label="Diet" value={data.lifestyle?.diet} />
              <Row label="Smoking" value={data.lifestyle?.smoking == null ? null : data.lifestyle.smoking ? "Yes" : "No"} />
              <Row label="Drinking" value={data.lifestyle?.drinking == null ? null : data.lifestyle.drinking ? "Yes" : "No"} />
              <Row label="Hobbies" value={data.lifestyle?.hobbies?.join(", ") || null} />
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-gold-soft">
      <CardContent className="p-4">
        <h2 className="mb-3 font-serif text-lg text-primary">{title}</h2>
        <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-4">{children}</dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
