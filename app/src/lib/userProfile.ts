import { sessionHeaders } from '@/lib/sessionHeaders';
import type { AccountCountryCode } from '@/lib/accountLocale';

export type SupportedLocale = 'en' | 'sw' | 'sheng';
export type SupportedProfileCountry = 'KE' | 'UG' | 'TZ' | 'RW' | 'GH' | 'NG';

export interface UserNotificationPreferences {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  push: boolean;
}

export interface UserProfileDTO {
  id?: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  locale: SupportedLocale;
  country: string;
  defaultCurrency?: string;
  hasVerifiedPhone?: boolean;
  notifications: UserNotificationPreferences;
}

export const PROFILE_LOCALES: { id: SupportedLocale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'sw', label: 'Kiswahili' },
  { id: 'sheng', label: 'Sheng' },
];

export const DEFAULT_NOTIFICATIONS: UserNotificationPreferences = {
  sms: false,
  whatsapp: false,
  email: false,
  push: true,
};

const LOCALE_KEY = 'baraza.profileLocale.v1';

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'en' || value === 'sw' || value === 'sheng';
}

export function isSupportedProfileCountry(value: string | null | undefined): value is SupportedProfileCountry {
  return value === 'KE' || value === 'UG' || value === 'TZ' || value === 'RW' || value === 'GH' || value === 'NG';
}

export function readLocalLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LOCALE_KEY);
  return isSupportedLocale(stored) ? stored : 'en';
}

export function writeLocalLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_KEY, locale);
}

export async function fetchUserProfile(
  getAccessToken?: () => Promise<string | null>,
): Promise<UserProfileDTO | null> {
  const headers = await sessionHeaders(getAccessToken);
  try {
    const res = await fetch('/api/user/profile', { headers });
    if (res.status === 401 || !res.ok) return null;
    const data = (await res.json()) as { profile?: UserProfileDTO };
    return data.profile ?? null;
  } catch {
    return null;
  }
}

export async function patchUserProfile(
  updates: Partial<Pick<UserProfileDTO, 'displayName' | 'bio' | 'locale' | 'avatarUrl'>> & {
    country?: SupportedProfileCountry;
    notifications?: Partial<UserNotificationPreferences>;
  },
  getAccessToken?: () => Promise<string | null>,
): Promise<{ ok: boolean; message?: string; profile?: UserProfileDTO }> {
  const headers = await sessionHeaders(getAccessToken);
  try {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    const data = (await res.json().catch(() => ({}))) as { profile?: UserProfileDTO; message?: string };
    return { ok: res.ok, message: data.message, profile: data.profile };
  } catch {
    return { ok: false, message: 'Could not reach the profile service. Try again.' };
  }
}

export async function subscribeWebPush(
  getAccessToken?: () => Promise<string | null>,
): Promise<{ ok: boolean; message: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, message: 'This browser does not support web push.' };
  }
  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, message: 'Web push was not enabled in the browser.' };
  }
  const headers = await sessionHeaders(getAccessToken);
  const res = await fetch('/api/user/notifications/push-subscribe', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      permission,
      endpoint: 'browser',
      userAgent: navigator.userAgent,
    }),
  }).catch(() => null);
  if (!res || res.status === 404 || res.status === 405) {
    return { ok: true, message: 'Browser notifications are on. Push subscribe is not available on this deployment yet.' };
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, message: data.message ?? 'Could not register push notifications.' };
  }
  return { ok: true, message: 'Web push enabled for votes, dues, and payouts.' };
}

export function countryForProfilePatch(code: AccountCountryCode): SupportedProfileCountry | undefined {
  return isSupportedProfileCountry(code) ? code : undefined;
}
