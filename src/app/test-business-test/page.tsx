export default async function TestFAS({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  console.log("=== FAS LEVEL 0 PARAMS ===");
  console.log(JSON.stringify(params, null, 2));

  const authaction = params.authaction || "";
  const tok = params.tok || "";

  // Build the URL that grants WiFi access
  const successUrl = "https://gate.maxmarketingfirm.com/test-business/success";

  // Build the URL that grants WiFi access
  const separator = authaction.includes("?") ? "&" : "?";
  const grantUrl = authaction
    ? `${authaction}${separator}tok=${tok}&redir=${encodeURIComponent(successUrl)}`
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
        MaxGate Debug — FAS Level 0
      </h1>

      <h2 style={{ fontSize: "14px", marginTop: "1.5rem" }}>
        Params received:
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
        {grantUrl || "(no authaction param received)"}
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
