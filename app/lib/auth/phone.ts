import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Normalize a user-typed phone number to E.164 (e.g. "+254712345678"),
 * which is the format Supabase Auth requires. Accepts local formats like
 * "0712 345 678" (resolved against `defaultCountry`) as well as numbers the
 * user already typed in international "+…" form.
 *
 * Returns null when the input isn't a valid phone number.
 */
export function toE164(
  input: string,
  defaultCountry: CountryCode = "KE",
): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** Mask a contact for display, e.g. "+254 7•• ••• 678" or "a•••@mail.com". */
export function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [name, domain] = contact.split("@");
    const head = name.slice(0, 1);
    return `${head}${"•".repeat(Math.max(name.length - 1, 1))}@${domain}`;
  }
  const tail = contact.slice(-3);
  const head = contact.slice(0, 4);
  return `${head} ${"•".repeat(3)} ${"•".repeat(3)} ${tail}`;
}
