import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CHAINS, type Chain, type ChainMeta } from '@/lib/chain';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKSh(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

export function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  });
}

export function formatRailAmountFromKes(amountKes: number, chainOrMeta: Chain | ChainMeta): string {
  const meta = typeof chainOrMeta === 'string' ? CHAINS[chainOrMeta] : chainOrMeta;
  const amount = amountKes / meta.currency.kesPerUnit;
  const formatted = amount.toLocaleString(meta.currency.locale, {
    minimumFractionDigits: amount >= 100 ? 0 : Math.min(2, meta.currency.decimals),
    maximumFractionDigits: meta.currency.decimals,
  });
  return `${meta.currency.symbol} ${formatted}`;
}

export function formatRailAmountWithKes(amountKes: number, chainOrMeta: Chain | ChainMeta): string {
  return `${formatRailAmountFromKes(amountKes, chainOrMeta)} (${formatKSh(amountKes)} eq.)`;
}

export function formatRailDate(
  value: string | number | Date,
  chainOrMeta: Chain | ChainMeta,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  const meta = typeof chainOrMeta === 'string' ? CHAINS[chainOrMeta] : chainOrMeta;
  return new Date(value).toLocaleDateString(meta.currency.locale, {
    ...options,
    timeZone: meta.timeZone,
  });
}

export function formatRailDateTime(
  value: string | number | Date,
  chainOrMeta: Chain | ChainMeta,
): string {
  const meta = typeof chainOrMeta === 'string' ? CHAINS[chainOrMeta] : chainOrMeta;
  return new Date(value).toLocaleString(meta.currency.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: meta.timeZone,
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
