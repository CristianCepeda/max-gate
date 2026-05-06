import { NextResponse } from "next/server";
import { getBusinessBySlug } from "@/lib/supabase";
import { computeTok, decodeFASParams } from "@/lib/opennds";
import { pushToGHL } from "@/lib/ghl";
import { isValidEmail } from "@/lib/utils";

const PORTAL_BASE = "https://gate.maxmarketingfirm.com";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { name, email, slug, fas } =
    (body as {
      name?: string;
      email?: string;
      slug?: string;
      fas?: string;
    }) ?? {};

  if (!name?.trim() || !email?.trim() || !slug?.trim()) {
    return NextResponse.json(
      { error: "name, email, and slug are required" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email.trim())) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  if (!fas) {
    return NextResponse.json(
      { error: "Missing FAS parameter" },
      { status: 400 },
    );
  }

  let ndsParams;
  try {
    ndsParams = decodeFASParams(fas);
  } catch (err) {
    console.error(`[MaxGate] FAS decode failed slug=${slug}`, err);
    return NextResponse.json(
      { error: "Invalid FAS parameter" },
      { status: 400 },
    );
  }

  if (!ndsParams.hid || !ndsParams.gatewayaddress) {
    return NextResponse.json(
      {
        error: "FAS parameter is missing required fields (hid, gatewayaddress)",
      },
      { status: 400 },
    );
  }

  const business = await getBusinessBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  pushToGHL(
    business,
    { name: name.trim(), email: email.trim() },
    ndsParams,
  ).catch((err: unknown) => {
    console.error(
      `[MaxGate GHL Push Failed] business=${slug} email=${email.trim()}`,
      err instanceof Error ? err.message : err,
    );
  });

  // tok = sha256(hid + faskey) — faskey is loaded per-business from Supabase
  const tok = computeTok(ndsParams.hid, business.faskey);

  // openNDS FAS level 1 grant URL: uses ?tok= and the /opennds_auth/ path
  const successUrl = `${PORTAL_BASE}/${slug}/success`;
  const redirectUrl =
    `http://${ndsParams.gatewayaddress}/opennds_auth/` +
    `?tok=${tok}&redir=${encodeURIComponent(successUrl)}`;

  console.log(
    `[MaxGate] redirectUrl slug=${slug} gatewayaddress=${ndsParams.gatewayaddress} url=${redirectUrl}`,
  );

  return NextResponse.json({ redirectUrl });
}
