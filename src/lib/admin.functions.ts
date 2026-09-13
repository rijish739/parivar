import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export type PendingProfile = {
  user_id: string;
  full_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  current_city: string | null;
  native_place: string | null;
  mother_tongue: string | null;
  marital_status: string | null;
  height_cm: number | null;
  is_verified: boolean;
  onboarding_complete: boolean;
  created_at: string;
};

export const adminCheckPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => ({ ok: checkPassword(data.password) }));

export const adminListProfiles = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; filter: "pending" | "verified" | "all" }) => data)
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("Unauthorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("profiles_basic")
      .select(
        "user_id, full_name, gender, date_of_birth, current_city, native_place, mother_tongue, marital_status, height_cm, is_verified, onboarding_complete, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.filter === "pending") q = q.eq("is_verified", false);
    if (data.filter === "verified") q = q.eq("is_verified", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as PendingProfile[];
  });

export const adminSetVerified = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; userId: string; verified: boolean }) => data)
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("Unauthorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles_basic")
      .update({ is_verified: data.verified })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; userId: string }) => data)
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("Unauthorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // remove profile row; auth user retained
    const { error } = await supabaseAdmin
      .from("profiles_basic")
      .delete()
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
