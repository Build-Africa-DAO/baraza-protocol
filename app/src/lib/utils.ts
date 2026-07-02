import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type Chain, type ChainMeta } from '@/lib/chain';
import { formatAccountCurrency, formatAccountDate, readAccountCountry } from '@/lib/accountLocale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKSh(amount: number): string {
  return formatAccountCurrency(amount);
}

export function formatKes(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`;
}

export function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  });
}

export function formatRailAmountFromKes(amountKes: number, chainOrMeta: Chain | ChainMeta): string {
  void chainOrMeta;
  return formatKSh(amountKes);
}

export function formatRailAmountWithKes(amountKes: number, chainOrMeta: Chain | ChainMeta): string {
  void chainOrMeta;
  return formatKSh(amountKes);
}

export function formatRailDate(
  value: string | number | Date,
  chainOrMeta: Chain | ChainMeta,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  void chainOrMeta;
  return formatAccountDate(value, readAccountCountry(), options);
}

export function formatRailDateTime(
  value: string | number | Date,
  chainOrMeta: Chain | ChainMeta,
): string {
  void chainOrMeta;
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function daysRemaining(endsAt: string): number {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}
