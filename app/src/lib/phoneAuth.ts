/**
 * Lightweight phone/email authentication for Baraza.
 * Stores a verified identifier in localStorage so users can interact
 * with the platform without a crypto wallet — useful for M-Pesa flows
 * where the user's primary identity is their phone number.
 */

const PHONE_KEY = 'baraza.auth.phone.v1';
const EMAIL_KEY = 'baraza.auth.email.v1';

export interface PhoneAuthSession {
  phone: string | null;
  email: string | null;
}

export function getPhoneAuthSession(): PhoneAuthSession {
  try {
    return {
      phone: localStorage.getItem(PHONE_KEY),
      email: localStorage.getItem(EMAIL_KEY),
    };
  } catch {
    return { phone: null, email: null };
  }
}

export function savePhoneSession(phone: string): void {
  const normalised = phone.trim().replace(/\s/g, '');
  localStorage.setItem(PHONE_KEY, normalised);
}

export function saveEmailSession(email: string): void {
  localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}

export function clearPhoneAuthSession(): void {
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

/** Returns a short display string for the connected identifier. */
export function formatAuthIdentifier(session: PhoneAuthSession): string | null {
  if (session.phone) {
    const p = session.phone;
    return p.length > 7 ? `${p.slice(0, 4)}…${p.slice(-3)}` : p;
  }
  if (session.email) {
    const [local, domain] = session.email.split('@');
    return `${local.slice(0, 3)}…@${domain}`;
  }
  return null;
}

/** Basic validation helpers */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.trim().replace(/\s/g, '');
  // Accept +254... (Kenya), 07..., 01..., and international formats
  return /^(\+?\d{9,15})$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
