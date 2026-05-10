import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate a Solana public key for display */
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Format a number as KSh currency */
export function formatKSh(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}

/** Format a number as SOL with decimals */
export function formatSol(lamports: number, decimals = 4): string {
  return `${(lamports / 1e9).toFixed(decimals)} SOL`;
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Calculate days remaining from a date string */
export function daysRemaining(dateStr: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

/** Sleep for ms milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
