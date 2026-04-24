import { createHash } from "crypto";

export interface OpenNDSParams {
  hid: string;
  clientip: string;
  clientmac: string;
  gatewayname: string;
  gatewayaddress: string;
  authdir: string;
  originurl: string;
  clientif: string;
}

/**
 * Decodes an openNDS FAS secure level 1 parameter string.
 *
 * The `fas` query param is base64-encoded. When decoded it contains
 * key=value pairs separated by ", " (comma-space) or "&" or newlines.
 * We support all common delimiters for robustness across openNDS versions.
 *
 * Example decoded:
 * "hid=abc123, clientip=192.168.8.100, clientmac=AA:BB:CC:DD:EE:FF,
 *  gatewayname=MaxGate, gatewayaddress=192.168.8.1, authdir=opennds_auth,
 *  originurl=http://example.com, clientif=br-lan"
 */
export function decodeFASParams(fas: string): OpenNDSParams {
  const decoded = Buffer.from(fas, "base64").toString("utf-8");
  console.log("RAW DECODED FAS STRING:", decoded);

  // Split on comma-space, ampersand, or newline — handle all openNDS variants
  const pairs = decoded.split(/,\s*|\n|&/);

  const params: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (key) params[key] = value;
  }

  return {
    hid: params.hid ?? "",
    clientip: params.clientip ?? "",
    clientmac: params.clientmac ?? "",
    gatewayname: params.gatewayname ?? "",
    gatewayaddress: params.gatewayaddress ?? "",
    authdir: params.authdir ?? "opennds_auth",
    originurl: params.originurl ?? "",
    clientif: params.clientif ?? "",
  };
}

/**
 * Computes the return hash ID required by openNDS FAS authentication.
 *
 * rhid = sha256(hid + faskey)
 *
 * This is security-critical — an incorrect hash means the customer won't
 * receive internet access. Uses Node.js native crypto, no third-party deps.
 */
export function computeRHID(hid: string, faskey: string): string {
  return createHash("sha256")
    .update(hid + faskey)
    .digest("hex");
}
