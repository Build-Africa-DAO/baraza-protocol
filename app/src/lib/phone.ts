/**
 * Phone number helpers — currently Kenya-only since the M-Pesa flow is the
 * only payment rail wired. When other markets land, generalise via a country
 * code parameter.
 */

/**
 * Normalises a Kenyan phone input to the 9-digit local subscriber form
 * (`7XX XXX XXX`). Accepts any of:
 *   - `7XX XXX XXX`
 *   - `07XX XXX XXX`
 *   - `+254 7XX XXX XXX` / `254 7XX XXX XXX`
 * Returns null when the input is not a valid Kenyan mobile number.
 */
export function normaliseKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('7')) return digits;
  if (digits.length === 10 && digits.startsWith('07')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('2547')) return digits.slice(3);
  return null;
}

/** Convenience: returns the full +254 E.164 form, or null if invalid. */
export function toE164Kenyan(raw: string): string | null {
  const local = normaliseKenyanPhone(raw);
  return local ? `+254${local}` : null;
}
