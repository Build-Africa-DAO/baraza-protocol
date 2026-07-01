export const ACCOUNT_COUNTRIES = [
  { code: 'KE', name: 'Kenya', currency: 'KES', locale: 'en-KE', timeZone: 'Africa/Nairobi', usdPerUnit: 0.0077 },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', locale: 'sw-TZ', timeZone: 'Africa/Dar_es_Salaam', usdPerUnit: 0.00039 },
  { code: 'UG', name: 'Uganda', currency: 'UGX', locale: 'en-UG', timeZone: 'Africa/Kampala', usdPerUnit: 0.00027 },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', locale: 'en-ET', timeZone: 'Africa/Addis_Ababa', usdPerUnit: 0.0091 },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', locale: 'en-NG', timeZone: 'Africa/Lagos', usdPerUnit: 0.00063 },
  { code: 'GH', name: 'Ghana', currency: 'GHS', locale: 'en-GH', timeZone: 'Africa/Accra', usdPerUnit: 0.067 },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', locale: 'en-ZA', timeZone: 'Africa/Johannesburg', usdPerUnit: 0.054 },
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', timeZone: 'America/New_York', usdPerUnit: 1 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', timeZone: 'Europe/London', usdPerUnit: 1.27 },
] as const;

export type AccountCountryCode = (typeof ACCOUNT_COUNTRIES)[number]['code'];
export type AccountCountry = (typeof ACCOUNT_COUNTRIES)[number];

const STORAGE_KEY = 'baraza.accountCountry.v1';
const KES_USD_REFERENCE = 0.0077;

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

export function convertKesToAccountCurrency(amountKes: number, country: AccountCountryCode = readAccountCountry()): number {
  const accountCountry = getAccountCountry(country);
  return (amountKes * KES_USD_REFERENCE) / accountCountry.usdPerUnit;
}

export function formatAccountCurrency(amountKes: number, country: AccountCountryCode = readAccountCountry()): string {
  const accountCountry = getAccountCountry(country);
  const amount = convertKesToAccountCurrency(amountKes, country);
  if (country === 'KE') return `KSh ${Math.round(amount).toLocaleString('en-KE')}`;
  return new Intl.NumberFormat(accountCountry.locale, {
    style: 'currency',
    currency: accountCountry.currency,
    maximumFractionDigits: accountCountry.currency === 'USD' || accountCountry.currency === 'GBP' ? 2 : 0,
  }).format(amount);
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
