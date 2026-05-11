import { createClient } from "@supabase/supabase-js";
import type { Business } from "@/types/business";

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

// Uses the service-role secret key (not the publishable/anon key) so server
// reads bypass RLS on `businesses`. The publishable key would require a
// public-read policy that exposes faskey — which grants WiFi access — to
// anyone hitting PostgREST. This module is server-only; the key must never
// reach the browser.
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _supabaseAdmin;
}

export async function getBusinessBySlug(
  slug: string,
): Promise<Business | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as Business;
}
