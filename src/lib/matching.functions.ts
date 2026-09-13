import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MatchCandidate = {
  user_id: string;
  full_name: string;
  age: number | null;
  height_cm: number | null;
  current_city: string | null;
  native_place: string | null;
  bari: string | null;
  occupation: string | null;
  photo_url: string | null;
  score: number;
};

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export const getMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Own profile + prefs
    const { data: me } = await supabase
      .from("profiles_basic")
      .select("gender, date_of_birth")
      .eq("user_id", userId)
      .maybeSingle();
    if (!me) return [] as MatchCandidate[];

    const { data: prefs } = await supabase
      .from("partner_preferences")
      .select("age_min, age_max, height_min_cm, height_max_cm, location_pref, bari_pref, diet_pref")
      .eq("user_id", userId)
      .maybeSingle();

    const targetGender = me.gender === "male" ? "female" : "male";

    const { data: candidates } = await supabase
      .from("profiles_basic")
      .select("user_id, full_name, date_of_birth, height_cm, current_city, native_place, gender, is_verified")
      .eq("gender", targetGender)
      .eq("is_verified", true)
      .neq("user_id", userId)
      .limit(50);

    if (!candidates?.length) return [] as MatchCandidate[];

    const ids = candidates.map((c) => c.user_id);

    // Existing interests (either direction) — exclude
    const { data: interests } = await supabase
      .from("interests")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    const excluded = new Set<string>();
    for (const i of interests ?? []) {
      excluded.add(i.sender_id === userId ? i.receiver_id : i.sender_id);
    }

    const [{ data: community }, { data: career }, { data: photos }] = await Promise.all([
      supabase.from("community_details").select("user_id, bari").in("user_id", ids),
      supabase.from("education_career").select("user_id, occupation").in("user_id", ids),
      supabase
        .from("profile_photos")
        .select("user_id, storage_path, is_primary, position")
        .in("user_id", ids)
        .order("position", { ascending: true }),
    ]);

    const bariByUser = new Map(community?.map((c) => [c.user_id, c.bari]) ?? []);
    const occByUser = new Map(career?.map((c) => [c.user_id, c.occupation]) ?? []);
    const photoByUser = new Map<string, string>();
    for (const p of photos ?? []) {
      if (!photoByUser.has(p.user_id)) photoByUser.set(p.user_id, p.storage_path);
    }

    // Signed URLs for primary photos
    const paths = Array.from(photoByUser.values());
    const signedByPath = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from("profile-photos")
        .createSignedUrls(paths, 60 * 60);
      for (const s of signed ?? []) {
        if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
      }
    }

    const ageMin = prefs?.age_min ?? 18;
    const ageMax = prefs?.age_max ?? 60;
    const hMin = prefs?.height_min_cm ?? 140;
    const hMax = prefs?.height_max_cm ?? 210;

    const results: MatchCandidate[] = [];
    for (const c of candidates) {
      if (excluded.has(c.user_id)) continue;
      const age = ageFromDob(c.date_of_birth);
      let score = 50;
      if (age != null) {
        if (age < ageMin || age > ageMax) score -= 25;
        else score += 15;
      }
      if (c.height_cm != null) {
        if (c.height_cm < hMin || c.height_cm > hMax) score -= 10;
        else score += 10;
      }
      const bari = bariByUser.get(c.user_id) ?? null;
      if (prefs?.bari_pref && bari && bari.toLowerCase().includes(prefs.bari_pref.toLowerCase())) {
        score += 15;
      }
      const path = photoByUser.get(c.user_id) ?? null;
      results.push({
        user_id: c.user_id,
        full_name: c.full_name,
        age,
        height_cm: c.height_cm,
        current_city: c.current_city,
        native_place: c.native_place,
        bari,
        occupation: occByUser.get(c.user_id) ?? null,
        photo_url: path ? signedByPath.get(path) ?? null : null,
        score,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  });
