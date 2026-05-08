import { createHash } from "crypto";

const FAS_KEY = process.env.FAS_KEY || "hasd-1zaj-vAnx";

function decodeLevel1FAS(fas: string): Record<string, string> {
  const decoded = Buffer.from(fas, "base64").toString("utf-8");
  const params: Record<string, string> = {};

  // openNDS uses ", " (comma-space) as the delimiter
  for (const pair of decoded.split(", ")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (key) params[key] = value;
  }
  return params;
}

export default async function TestFAS({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const fasParam = sp.fas || "";

  const params = fasParam ? decodeLevel1FAS(fasParam) : {};
  const hid = params.hid || "";
  const gatewayaddress = params.gatewayaddress || "";

  // console.log("=== FAS LEVEL 1 PARAMS ===");
  // console.log("Raw fas:", fasParam);
  // console.log("Decoded:", JSON.stringify(params, null, 2));

  // Compute the auth token: sha256(hid + faskey)
  // This exactly matches the PHP example: $tok = hash('sha256', $hid.$key);
  const tok = hid
    ? createHash("sha256")
        .update(hid + FAS_KEY)
        .digest("hex")
    : "";

  // The page they land on after WiFi auth is granted
  const successUrl = "https://gate.maxmarketingfirm.com/test-business/success";

  // Build the grant URL
  // openNDS v9.8.0 uses /opennds_auth/ as the auth path
  // and `tok` (not `rhid`) as the param name
  const grantUrl =
    gatewayaddress && tok
      ? `http://${gatewayaddress}/opennds_auth/?tok=${tok}&redir=${encodeURIComponent(
          successUrl,
        )}`
      : "";

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "monospace",
        fontSize: "13px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "20px", marginBottom: "1rem" }}>
        MaxGate Debug — FAS Level 1
      </h1>

      <h2 style={{ fontSize: "14px", marginTop: "1.5rem" }}>
        Raw fas param (base64):
      </h2>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "12px",
          borderRadius: "6px",
          overflow: "auto",
          fontSize: "12px",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
      >
        {fasParam || "(no fas param received)"}
      </pre>

      <h2 style={{ fontSize: "14px", marginTop: "1.5rem" }}>
        Decoded FAS params:
      </h2>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "12px",
          borderRadius: "6px",
          overflow: "auto",
          fontSize: "12px",
        }}
      >
        {JSON.stringify(params, null, 2)}
      </pre>

      <h2 style={{ fontSize: "14px", marginTop: "1.5rem" }}>
        Computed tok (sha256 of hid+faskey):
      </h2>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "12px",
          borderRadius: "6px",
          overflow: "auto",
          fontSize: "12px",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
      >
        {tok || "(no hid received)"}
      </pre>

      <h2 style={{ fontSize: "14px", marginTop: "1.5rem" }}>Grant URL:</h2>
      <p
        style={{
          wordBreak: "break-all",
          background: "#f4f4f4",
          padding: "12px",
          borderRadius: "6px",
          fontSize: "12px",
        }}
      >
        {grantUrl || "(missing required params)"}
      </p>

      {grantUrl && (
        <a
          href={grantUrl}
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            background: "#000",
            color: "#FFD700",
            padding: "14px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          Connect to WiFi
        </a>
      )}
    </main>
  );
}
