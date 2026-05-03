import { NextResponse } from "next/server";
import { getBusinessBySlug } from "@/lib/supabase";
import { decodeFASParams, computeRHID, verifyFASKeyHash } from "@/lib/opennds";
import { pushToGHL } from "@/lib/ghl";
import { isValidEmail, normalizePhone } from "@/lib/utils";

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

  const { name, email, phone, slug, fas, sha256 } =
    (body as {
      name?: string;
      email?: string;
      phone?: string;
      slug?: string;
      fas?: string;
      sha256?: string;
    }) ?? {};

  // Basic validation
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !slug?.trim()) {
    return NextResponse.json(
      { error: "name, email, phone, and slug are required" },
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

  if (!sha256) {
    return NextResponse.json(
      { error: "Missing sha256 parameter" },
      { status: 400 },
    );
  }

  // 1. Decode openNDS FAS params
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

  if (!ndsParams.hid || !ndsParams.gatewayaddress || !ndsParams.authdir) {
    return NextResponse.json(
      {
        error:
          "FAS parameter is missing required fields (hid, gatewayaddress, authdir)",
      },
      { status: 400 },
    );
  }

  // 2. Load business config from Supabase
  const business = await getBusinessBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Verify the router's identity — sha256 must equal sha256(faskey)
  if (!verifyFASKeyHash(business.faskey, sha256)) {
    console.error(`[MaxGate] FAS key hash mismatch slug=${slug}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const normalizedPhone = normalizePhone(phone.trim());

  // 3. Fire-and-forget GHL push — never block WiFi grant on this
  pushToGHL(
    business,
    { name: name.trim(), email: email.trim(), phone: normalizedPhone },
    ndsParams,
  ).catch((err: unknown) => {
    console.error(
      `[MaxGate GHL Push Failed] business=${slug} email=${email.trim()}`,
      err instanceof Error ? err.message : err,
    );
  });

  // 4. Compute the openNDS return hash (security-critical)
  const rhid = computeRHID(ndsParams.hid, business.faskey);

  // 5. Build the WiFi grant redirect URL
  const successUrl = `${PORTAL_BASE}/${slug}/success`;
  const redirectUrl =
    `http://${ndsParams.gatewayaddress}/${ndsParams.authdir}/` +
    `?rhid=${rhid}&redir=${encodeURIComponent(successUrl)}`;

  console.log(
    `[MaxGate] redirectUrl slug=${slug} gatewayaddress=${ndsParams.gatewayaddress} authdir=${ndsParams.authdir} url=${redirectUrl}`,
  );

  // 6. Return redirect URL to the client
  return NextResponse.json({ redirectUrl });
}
