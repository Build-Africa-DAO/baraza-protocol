export const ACCOUNT_COUNTRIES = [
  { code: 'KE', name: 'Kenya', currency: 'KES', locale: 'en-KE', timeZone: 'Africa/Nairobi' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', locale: 'en-RW', timeZone: 'Africa/Kigali' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', locale: 'sw-TZ', timeZone: 'Africa/Dar_es_Salaam' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', locale: 'en-UG', timeZone: 'Africa/Kampala' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', locale: 'en-ET', timeZone: 'Africa/Addis_Ababa' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', locale: 'en-NG', timeZone: 'Africa/Lagos' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', locale: 'en-GH', timeZone: 'Africa/Accra' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', locale: 'en-ZA', timeZone: 'Africa/Johannesburg' },
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', timeZone: 'America/New_York' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', timeZone: 'Europe/London' },
] as const;

export type AccountCountryCode = (typeof ACCOUNT_COUNTRIES)[number]['code'];
export type AccountCountry = (typeof ACCOUNT_COUNTRIES)[number];

const STORAGE_KEY = 'baraza.accountCountry.v1';

export function isAccountCountryCode(value: string | null): value is AccountCountryCode {
  return ACCOUNT_COUNTRIES.some((country) => country.code === value);
}

export function inferAccountCountry(): AccountCountryCode {
  if (typeof navigator === 'undefined') return 'KE';
  try {
    const region = new Intl.Locale(navigator.language).region ?? null;
    if (isAccountCountryCode(region)) return region;
  } catch {
    // Fall through to the timezone signal.
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneCountries: Record<string, AccountCountryCode> = {
    'Africa/Nairobi': 'KE',
    'Africa/Kigali': 'RW',
    'Africa/Dar_es_Salaam': 'TZ',
    'Africa/Kampala': 'UG',
    'Africa/Addis_Ababa': 'ET',
    'Africa/Lagos': 'NG',
    'Africa/Accra': 'GH',
    'Africa/Johannesburg': 'ZA',
    'Europe/London': 'GB',
  };
  return timeZoneCountries[timeZone] ?? 'KE';
}

/** True only when the person picked a country; inference does not count. */
export function hasStoredAccountCountry(): boolean {
  if (typeof window === 'undefined') return false;
  return isAccountCountryCode(window.localStorage.getItem(STORAGE_KEY));
}

export function readAccountCountry(): AccountCountryCode {
  if (typeof window === 'undefined') return 'KE';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isAccountCountryCode(stored) ? stored : inferAccountCountry();
}

export function writeAccountCountry(country: AccountCountryCode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, country);
}

export function getAccountCountry(country: AccountCountryCode = readAccountCountry()): AccountCountry {
  return ACCOUNT_COUNTRIES.find((option) => option.code === country) ?? ACCOUNT_COUNTRIES[0];
}

export function formatAccountDate(
  value: string | number | Date,
  country: AccountCountryCode = readAccountCountry(),
  options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' },
): string {
  const accountCountry = getAccountCountry(country);
  return new Date(value).toLocaleDateString(accountCountry.locale, {
    ...options,
    timeZone: accountCountry.timeZone,
  });
}
