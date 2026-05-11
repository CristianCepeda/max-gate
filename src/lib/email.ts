import 'server-only';
import { promises as dns } from 'node:dns';
// `disposable-domains` ships only an index.json (no TS types); declared in src/types/disposable-domains.d.ts.
import disposableDomains from 'disposable-domains';

const DISPOSABLE_EXACT: Set<string> = new Set(disposableDomains);

const UNVERIFIABLE_MSG = 'We couldn’t verify that email address. Please double-check it.';
const DISPOSABLE_MSG = 'This email provider isn’t accepted. Please use a real email.';

// Entries are treated as suffixes — block the exact domain *and* any subdomain.
// Walks label boundaries (O(labels)) rather than scanning the full list.
function isDisposable(domain: string): boolean {
  const labels = domain.split('.');
  for (let i = 0; i < labels.length - 1; i++) {
    if (DISPOSABLE_EXACT.has(labels.slice(i).join('.'))) return true;
  }
  return false;
}

/**
 * Server-side deliverability check. Rejects disposable-email domains and
 * domains with no MX records. Fails open on transient resolver errors so a
 * flaky DNS lookup doesn't lock real users out of WiFi.
 * Returns null when the email looks deliverable, or a user-facing reason.
 */
export async function verifyEmailDeliverable(email: string): Promise<string | null> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return UNVERIFIABLE_MSG;

  if (isDisposable(domain)) return DISPOSABLE_MSG;

  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) return UNVERIFIABLE_MSG;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOTFOUND' || code === 'ENODATA') return UNVERIFIABLE_MSG;
    console.error(`[MaxGate] MX lookup failed for ${domain}:`, err);
    return null;
  }

  return null;
}
