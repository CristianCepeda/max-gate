import { createHash } from "crypto";

export interface OpenNDSParams {
  hid: string;
  clientip: string;
  clientmac: string;
  client_type: string;
  gatewayname: string;
  gatewayurl: string;
  version: string;
  gatewayaddress: string;
  gatewaymac: string;
  originurl: string;
  clientif: string;
  themespec: string;
}

/**
 * Decodes an openNDS FAS Level 1 base64 parameter string into key/value pairs.
 *
 * openNDS encodes the FAS payload as base64. When decoded, it contains
 * key=value pairs. The delimiter varies by openNDS version:
 *   - v9+: ", " (comma-space)
 *   - older: "&" or newline
 * The regex handles all three so this works regardless of router firmware version.
 *
 * Example decoded string:
 *   "hid=abc123, clientip=192.168.8.100, gatewayaddress=192.168.8.1, ..."
 */
export function decodeFASParams(fas: string): OpenNDSParams {
  const decoded = Buffer.from(fas, "base64").toString("utf-8");

  // Split on comma-space, ampersand, or newline to handle all openNDS variants
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
    client_type: params.client_type ?? "",
    gatewayname: params.gatewayname ?? "",
    gatewayurl: params.gatewayurl ?? "",
    version: params.version ?? "",
    gatewayaddress: params.gatewayaddress ?? "",
    gatewaymac: params.gatewaymac ?? "",
    originurl: params.originurl ?? "",
    clientif: params.clientif ?? "",
    themespec: params.themespec ?? "",
  };
}

/**
 * Normalizes a MAC address for comparison: strips separators and lowercases.
 * Accepts "AA:BB:CC:DD:EE:FF", "aa-bb-cc-dd-ee-ff", "aabbccddeeff", etc.
 * Returns "" for input that doesn't contain 12 hex chars.
 */
export function normalizeMac(mac: string): string {
  const stripped = mac.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  return stripped.length === 12 ? stripped : "";
}

/**
 * Computes the auth token required by openNDS to grant WiFi access.
 *
 * tok = sha256(hid + faskey)
 *
 * This matches the openNDS FAS Level 1 spec. The faskey must match the value
 * configured on the router — a mismatch means the customer won't get internet.
 */
export function computeTok(hid: string, faskey: string): string {
  return createHash("sha256")
    .update(hid + faskey)
    .digest("hex");
}
