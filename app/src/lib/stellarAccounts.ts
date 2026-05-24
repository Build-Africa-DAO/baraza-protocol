import { isValidStellarPublicKey } from '@/lib/stellar';

const STORAGE_KEY = 'baraza.stellarAccounts.v1';

type LinkedStellarAccounts = Record<string, string>;

function readAccounts(): LinkedStellarAccounts {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as LinkedStellarAccounts
      : {};
  } catch {
    return {};
  }
}

function writeAccounts(accounts: LinkedStellarAccounts): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function getLinkedStellarAccount(ownerWallet: string): string | null {
  return readAccounts()[ownerWallet] ?? null;
}

export function saveLinkedStellarAccount(ownerWallet: string, stellarAccount: string): string {
  const nextAccount = stellarAccount.trim();
  if (!isValidStellarPublicKey(nextAccount)) {
    throw new Error('Enter a valid Stellar public key.');
  }

  const accounts = readAccounts();
  accounts[ownerWallet] = nextAccount;
  writeAccounts(accounts);
  return nextAccount;
}

export function clearLinkedStellarAccount(ownerWallet: string): void {
  const accounts = readAccounts();
  delete accounts[ownerWallet];
  writeAccounts(accounts);
}
