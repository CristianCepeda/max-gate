import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Called by the router on a cron schedule (e.g. every 2 minutes).
// Authenticated with slug + faskey to prevent spoofing.
// Updates last_seen_at, which the dashboard uses for connected/disconnected status.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { slug, faskey } =
    (body as { slug?: string; faskey?: string }) ?? {};

  if (!slug?.trim() || !faskey?.trim()) {
    return NextResponse.json(
      { error: "slug and faskey are required" },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: business } = await supabase
    .from("businesses")
    .select("id, faskey")
    .eq("slug", slug.trim())
    .eq("is_active", true)
    .single();

  if (!business || business.faskey !== faskey.trim()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("businesses")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", business.id);

  return NextResponse.json({ ok: true });
}
