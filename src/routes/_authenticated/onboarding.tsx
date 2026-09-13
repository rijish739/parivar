import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Complete your profile — Parivar" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

// --- Types (kept loose to match Supabase enums stored as strings) ---
type FormState = {
  // 1 basic
  full_name: string;
  gender: "" | "male" | "female";
  date_of_birth: string;
  height_cm: string;
  weight_kg: string;
  marital_status: "never_married" | "divorced" | "widowed";
  mother_tongue: string;
  current_city: string;
  native_place: string;
  photos: File[];
  // 2 community
  bari: string;
  family_deity: string;
  gotra: string;
  family_background: "" | "agriculture" | "business" | "service" | "other";
  // 3 education & career
  highest_qualification: string;
  field_of_study: string;
  occupation: string;
  company: string;
  annual_income: "" | "below_5L" | "5_10L" | "10_20L" | "20_50L" | "50L_plus";
  // 4 family
  father_occupation: string;
  mother_occupation: string;
  siblings_married: string;
  siblings_unmarried: string;
  family_type: "" | "nuclear" | "joint";
  family_values: "" | "traditional" | "moderate" | "liberal";
  // 5 lifestyle
  diet: "" | "veg" | "non_veg" | "eggetarian";
  smoking: boolean;
  drinking: boolean;
  hobbies: string;
  // 6 horoscope
  horoscope_provided: boolean;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  rashi: string;
  nakshatra: string;
  manglik: "yes" | "no" | "partial" | "unknown";
  horoscope_matching_required: boolean;
  // 7 partner preferences
  age_min: number;
  age_max: number;
  height_min_cm: number;
  height_max_cm: number;
  education_pref: string;
  income_pref: "" | "below_5L" | "5_10L" | "10_20L" | "20_50L" | "50L_plus";
  location_pref: "same_city" | "same_state" | "open";
  diet_pref: "" | "veg" | "non_veg" | "eggetarian";
  bari_pref: string;
  deal_breakers: string[];
  // 8 privacy
  profile_visibility: "everyone" | "mutual_only";
  photo_visibility: "public" | "blur_until_mutual";
};

const initial: FormState = {
  full_name: "", gender: "", date_of_birth: "", height_cm: "", weight_kg: "",
  marital_status: "never_married", mother_tongue: "Tulu", current_city: "", native_place: "",
  photos: [],
  bari: "", family_deity: "", gotra: "", family_background: "",
  highest_qualification: "", field_of_study: "", occupation: "", company: "", annual_income: "",
  father_occupation: "", mother_occupation: "", siblings_married: "0", siblings_unmarried: "0",
  family_type: "", family_values: "",
  diet: "", smoking: false, drinking: false, hobbies: "",
  horoscope_provided: true, birth_date: "", birth_time: "", birth_place: "", rashi: "",
  nakshatra: "", manglik: "unknown", horoscope_matching_required: false,
  age_min: 24, age_max: 32, height_min_cm: 155, height_max_cm: 185,
  education_pref: "", income_pref: "", location_pref: "open", diet_pref: "", bari_pref: "",
  deal_breakers: [],
  profile_visibility: "everyone", photo_visibility: "public",
};

const STEPS = [
  "Basic details",
  "Community",
  "Education & career",
  "Family",
  "Lifestyle",
  "Horoscope",
  "Partner preferences",
  "Privacy",
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // 1. profile_basic
      const { error: pbErr } = await supabase.from("profiles_basic").upsert({
        user_id: userId,
        full_name: form.full_name.trim(),
        gender: form.gender as "male" | "female",
        date_of_birth: form.date_of_birth,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        marital_status: form.marital_status,
        mother_tongue: form.mother_tongue || null,
        current_city: form.current_city || null,
        native_place: form.native_place || null,
        onboarding_complete: true,
      });
      if (pbErr) throw pbErr;

      // Photos
      for (let i = 0; i < form.photos.length; i++) {
        const file = form.photos[i];
        const ext = file.name.split(".").pop();
        const path = `${userId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        await supabase.from("profile_photos").insert({
          user_id: userId, storage_path: path, is_primary: i === 0, position: i,
        });
      }

      // 2 community
      await supabase.from("community_details").upsert({
        user_id: userId,
        bari: form.bari || null,
        family_deity: form.family_deity || null,
        gotra: form.gotra || null,
        family_background: form.family_background || null,
      });

      // 3 education
      await supabase.from("education_career").upsert({
        user_id: userId,
        highest_qualification: form.highest_qualification || null,
        field_of_study: form.field_of_study || null,
        occupation: form.occupation || null,
        company: form.company || null,
        annual_income: form.annual_income || null,
      });

      // 4 family
      await supabase.from("family_details").upsert({
        user_id: userId,
        father_occupation: form.father_occupation || null,
        mother_occupation: form.mother_occupation || null,
        siblings_married: Number(form.siblings_married) || 0,
        siblings_unmarried: Number(form.siblings_unmarried) || 0,
        family_type: form.family_type || null,
        family_values: form.family_values || null,
      });

      // 5 lifestyle
      await supabase.from("lifestyle").upsert({
        user_id: userId,
        diet: form.diet || null,
        smoking: form.smoking,
        drinking: form.drinking,
        hobbies: form.hobbies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });

      // 6 horoscope
      await supabase.from("horoscope").upsert({
        user_id: userId,
        provided: form.horoscope_provided,
        birth_date: form.horoscope_provided && form.birth_date ? form.birth_date : null,
        birth_time: form.horoscope_provided && form.birth_time ? form.birth_time : null,
        birth_place: form.horoscope_provided ? form.birth_place || null : null,
        rashi: form.horoscope_provided ? form.rashi || null : null,
        nakshatra: form.horoscope_provided ? form.nakshatra || null : null,
        manglik: form.horoscope_provided ? form.manglik : "unknown",
        matching_required: form.horoscope_matching_required,
      });

      // 7 preferences
      await supabase.from("partner_preferences").upsert({
        user_id: userId,
        age_min: form.age_min,
        age_max: form.age_max,
        height_min_cm: form.height_min_cm,
        height_max_cm: form.height_max_cm,
        education_pref: form.education_pref || null,
        income_pref: form.income_pref || null,
        location_pref: form.location_pref,
        diet_pref: form.diet_pref || null,
        bari_pref: form.bari_pref || null,
        deal_breakers: form.deal_breakers,
      });

      // 8 privacy
      await supabase.from("privacy_settings").upsert({
        user_id: userId,
        profile_visibility: form.profile_visibility,
        photo_visibility: form.photo_visibility,
      });

      toast.success("Profile submitted for verification");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = (): boolean => {
    if (step === 0) {
      return Boolean(
        form.full_name.trim() && form.gender && form.date_of_birth,
      );
    }
    return true;
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-hero-warm">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-2xl text-primary">Complete your profile</h1>
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mb-6" />

        <Card className="border-gold-soft">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-primary">{STEPS[step]}</CardTitle>
            <CardDescription>{descriptionFor(step)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && <BasicStep form={form} set={set} />}
            {step === 1 && <CommunityStep form={form} set={set} />}
            {step === 2 && <EducationStep form={form} set={set} />}
            {step === 3 && <FamilyStep form={form} set={set} />}
            {step === 4 && <LifestyleStep form={form} set={set} />}
            {step === 5 && <HoroscopeStep form={form} set={set} />}
            {step === 6 && <PreferencesStep form={form} set={set} />}
            {step === 7 && <PrivacyStep form={form} set={set} />}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" onClick={back} disabled={step === 0 || saving}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {isLast ? (
            <Button className="bg-primary" onClick={finish} disabled={saving || !canProceed()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for verification
            </Button>
          ) : (
            <Button className="bg-primary" onClick={next} disabled={!canProceed()}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function descriptionFor(step: number) {
  return [
    "Tell us about yourself — this is what other members will first see.",
    "Your community details help us find matches your family will approve of.",
    "Share your education and profession.",
    "A few words about your family.",
    "Your daily lifestyle preferences.",
    "Horoscope details — completely optional.",
    "What you're looking for in a partner.",
    "Control who sees what on your profile.",
  ][step];
}

// ==================== Step components ====================
type StepProps = {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
};

function BasicStep({ form, set }: StepProps) {
  return (
    <>
      <Field label="Full name" required>
        <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
      </Field>
      <Field label="Gender" required>
        <RadioGroup
          value={form.gender}
          onValueChange={(v) => set("gender", v as "male" | "female")}
          className="flex gap-6"
        >
          <label className="flex items-center gap-2"><RadioGroupItem value="male" /> Male</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="female" /> Female</label>
        </RadioGroup>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of birth" required>
          <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
        </Field>
        <Field label="Marital status">
          <Select value={form.marital_status} onValueChange={(v) => set("marital_status", v as FormState["marital_status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="never_married">Never married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Height (cm)">
          <Input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
        </Field>
        <Field label="Weight (kg)">
          <Input type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
        </Field>
      </div>
      <Field label="Mother tongue">
        <Input value={form.mother_tongue} onChange={(e) => set("mother_tongue", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current city">
          <Input value={form.current_city} onChange={(e) => set("current_city", e.target.value)} />
        </Field>
        <Field label="Native place / taluk">
          <Input value={form.native_place} onChange={(e) => set("native_place", e.target.value)} />
        </Field>
      </div>
      <Field label="Photos (first is primary)">
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => set("photos", Array.from(e.target.files ?? []))}
        />
        {form.photos.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {form.photos.length} photo(s) selected
          </p>
        )}
      </Field>
    </>
  );
}

function CommunityStep({ form, set }: StepProps) {
  return (
    <>
      <Field label="Sub-division / Bari">
        <Input placeholder="e.g. Kola bari, Bangera bari" value={form.bari} onChange={(e) => set("bari", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Family deity">
          <Input value={form.family_deity} onChange={(e) => set("family_deity", e.target.value)} />
        </Field>
        <Field label="Gotra">
          <Input value={form.gotra} onChange={(e) => set("gotra", e.target.value)} />
        </Field>
      </div>
      <Field label="Family background">
        <Select value={form.family_background} onValueChange={(v) => set("family_background", v as FormState["family_background"])}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="agriculture">Agriculture</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}

function EducationStep({ form, set }: StepProps) {
  return (
    <>
      <Field label="Highest qualification">
        <Input placeholder="e.g. B.E., MBA" value={form.highest_qualification} onChange={(e) => set("highest_qualification", e.target.value)} />
      </Field>
      <Field label="Field of study">
        <Input value={form.field_of_study} onChange={(e) => set("field_of_study", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Occupation">
          <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </Field>
        <Field label="Company (optional)">
          <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
      </div>
      <Field label="Annual income">
        <Select value={form.annual_income} onValueChange={(v) => set("annual_income", v as FormState["annual_income"])}>
          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="below_5L">Below ₹5 Lakhs</SelectItem>
            <SelectItem value="5_10L">₹5–10 Lakhs</SelectItem>
            <SelectItem value="10_20L">₹10–20 Lakhs</SelectItem>
            <SelectItem value="20_50L">₹20–50 Lakhs</SelectItem>
            <SelectItem value="50L_plus">₹50 Lakhs+</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}

function FamilyStep({ form, set }: StepProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Father's occupation">
          <Input value={form.father_occupation} onChange={(e) => set("father_occupation", e.target.value)} />
        </Field>
        <Field label="Mother's occupation">
          <Input value={form.mother_occupation} onChange={(e) => set("mother_occupation", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Siblings — married">
          <Input type="number" min="0" value={form.siblings_married} onChange={(e) => set("siblings_married", e.target.value)} />
        </Field>
        <Field label="Siblings — unmarried">
          <Input type="number" min="0" value={form.siblings_unmarried} onChange={(e) => set("siblings_unmarried", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Family type">
          <Select value={form.family_type} onValueChange={(v) => set("family_type", v as FormState["family_type"])}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nuclear">Nuclear</SelectItem>
              <SelectItem value="joint">Joint</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Family values">
          <Select value={form.family_values} onValueChange={(v) => set("family_values", v as FormState["family_values"])}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="traditional">Traditional</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="liberal">Liberal</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </>
  );
}

function LifestyleStep({ form, set }: StepProps) {
  return (
    <>
      <Field label="Diet">
        <RadioGroup value={form.diet} onValueChange={(v) => set("diet", v as FormState["diet"])} className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><RadioGroupItem value="veg" /> Vegetarian</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="non_veg" /> Non-vegetarian</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="eggetarian" /> Eggetarian</label>
        </RadioGroup>
      </Field>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label>Smoking</Label>
        <Switch checked={form.smoking} onCheckedChange={(v) => set("smoking", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label>Drinking</Label>
        <Switch checked={form.drinking} onCheckedChange={(v) => set("drinking", v)} />
      </div>
      <Field label="Hobbies (comma-separated)">
        <Textarea placeholder="e.g. Reading, Trekking, Bharatanatyam" value={form.hobbies} onChange={(e) => set("hobbies", e.target.value)} />
      </Field>
    </>
  );
}

function HoroscopeStep({ form, set }: StepProps) {
  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-gold-soft bg-accent/30 p-3">
        <div>
          <Label>Provide horoscope details</Label>
          <p className="text-xs text-muted-foreground">Turn off to skip this section</p>
        </div>
        <Switch checked={form.horoscope_provided} onCheckedChange={(v) => set("horoscope_provided", v)} />
      </div>
      {form.horoscope_provided && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of birth">
              <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
            </Field>
            <Field label="Time of birth">
              <Input type="time" value={form.birth_time} onChange={(e) => set("birth_time", e.target.value)} />
            </Field>
          </div>
          <Field label="Place of birth">
            <Input value={form.birth_place} onChange={(e) => set("birth_place", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rashi"><Input value={form.rashi} onChange={(e) => set("rashi", e.target.value)} /></Field>
            <Field label="Nakshatra"><Input value={form.nakshatra} onChange={(e) => set("nakshatra", e.target.value)} /></Field>
          </div>
          <Field label="Manglik">
            <Select value={form.manglik} onValueChange={(v) => set("manglik", v as FormState["manglik"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Not sure</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label>Horoscope matching required</Label>
            <Switch checked={form.horoscope_matching_required} onCheckedChange={(v) => set("horoscope_matching_required", v)} />
          </div>
        </>
      )}
    </>
  );
}

const DEAL_BREAKERS = [
  { id: "smoking", label: "No smoking" },
  { id: "drinking", label: "No drinking" },
  { id: "non_veg", label: "Vegetarian only" },
  { id: "manglik", label: "Non-manglik only" },
];

function PreferencesStep({ form, set }: StepProps) {
  const toggleDb = (id: string) => {
    const has = form.deal_breakers.includes(id);
    set("deal_breakers", has ? form.deal_breakers.filter((x) => x !== id) : [...form.deal_breakers, id]);
  };
  return (
    <>
      <Field label={`Age range: ${form.age_min} – ${form.age_max}`}>
        <Slider
          min={21} max={60} step={1}
          value={[form.age_min, form.age_max]}
          onValueChange={([a, b]) => { set("age_min", a); set("age_max", b); }}
        />
      </Field>
      <Field label={`Height range: ${form.height_min_cm} – ${form.height_max_cm} cm`}>
        <Slider
          min={140} max={210} step={1}
          value={[form.height_min_cm, form.height_max_cm]}
          onValueChange={([a, b]) => { set("height_min_cm", a); set("height_max_cm", b); }}
        />
      </Field>
      <Field label="Education preference">
        <Input placeholder="e.g. Graduate or above" value={form.education_pref} onChange={(e) => set("education_pref", e.target.value)} />
      </Field>
      <Field label="Income preference">
        <Select value={form.income_pref} onValueChange={(v) => set("income_pref", v as FormState["income_pref"])}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="below_5L">Below ₹5 L</SelectItem>
            <SelectItem value="5_10L">₹5–10 L</SelectItem>
            <SelectItem value="10_20L">₹10–20 L</SelectItem>
            <SelectItem value="20_50L">₹20–50 L</SelectItem>
            <SelectItem value="50L_plus">₹50 L+</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Location preference">
        <RadioGroup value={form.location_pref} onValueChange={(v) => set("location_pref", v as FormState["location_pref"])} className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><RadioGroupItem value="same_city" /> Same city</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="same_state" /> Same state</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="open" /> Open</label>
        </RadioGroup>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Diet preference">
          <Select value={form.diet_pref} onValueChange={(v) => set("diet_pref", v as FormState["diet_pref"])}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="veg">Vegetarian</SelectItem>
              <SelectItem value="non_veg">Non-vegetarian</SelectItem>
              <SelectItem value="eggetarian">Eggetarian</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Sub-division preference (optional)">
          <Input value={form.bari_pref} onChange={(e) => set("bari_pref", e.target.value)} />
        </Field>
      </div>
      <Field label="Deal-breakers">
        <div className="space-y-2">
          {DEAL_BREAKERS.map((d) => (
            <label key={d.id} className="flex items-center gap-2">
              <Checkbox checked={form.deal_breakers.includes(d.id)} onCheckedChange={() => toggleDb(d.id)} />
              {d.label}
            </label>
          ))}
        </div>
      </Field>
    </>
  );
}

function PrivacyStep({ form, set }: StepProps) {
  return (
    <>
      <Field label="Who can view your full profile?">
        <RadioGroup value={form.profile_visibility} onValueChange={(v) => set("profile_visibility", v as FormState["profile_visibility"])} className="space-y-2">
          <label className="flex items-center gap-2"><RadioGroupItem value="everyone" /> All verified members</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="mutual_only" /> Only after mutual interest</label>
        </RadioGroup>
      </Field>
      <Field label="Photo visibility">
        <RadioGroup value={form.photo_visibility} onValueChange={(v) => set("photo_visibility", v as FormState["photo_visibility"])} className="space-y-2">
          <label className="flex items-center gap-2"><RadioGroupItem value="public" /> Visible to all verified members</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="blur_until_mutual" /> Blurred until mutual interest</label>
        </RadioGroup>
      </Field>
      <div className="rounded-lg border border-gold-soft bg-accent/30 p-4">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">One last step</p>
            <p className="text-sm text-muted-foreground">
              After submitting, your profile will be reviewed by our team (24–48 hours). You'll be
              notified once it's live.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

