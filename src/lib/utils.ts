/**
 * Formats a phone number string to E.164 format for GHL.
 * Accepts common US formats: (555) 555-5555, 555-555-5555, 5555555555, +15555555555
 * Returns the original string if it can't be normalized.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return raw;
}

/**
 * Validates an email address with a basic RFC-compliant pattern.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Returns a CSS-safe hex color, falling back to a default if the value is
 * missing or not a valid hex string.
 */
export function safeColor(color: string | null | undefined, fallback: string): string {
  if (!color) return fallback;
  return /^#[0-9a-fA-F]{3,6}$/.test(color) ? color : fallback;
}
