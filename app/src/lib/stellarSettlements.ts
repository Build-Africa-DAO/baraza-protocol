import type { StellarPaymentResult } from '@/lib/stellar';

const STORAGE_KEY = 'baraza.stellarSettlements.v1';

export type StellarSettlementStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'NOT_FOUND';

export interface StellarSettlementRecord {
  settlementId: string;
  ownerWallet: string;
  stellarAccount: string;
  txHash: string;
  status: StellarSettlementStatus;
  ledger: number | null;
  successful: boolean | null;
  assetCode: string;
  amount: string | null;
  memo: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

function readSettlements(): StellarSettlementRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSettlements(records: StellarSettlementRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function generateSettlementId(): string {
  return `stl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function statusFromConfirmation(confirmation: StellarPaymentResult | null): StellarSettlementStatus {
  if (!confirmation) return 'NOT_FOUND';
  return confirmation.successful ? 'CONFIRMED' : 'FAILED';
}

export function listStellarSettlements(ownerWallet: string): StellarSettlementRecord[] {
  return readSettlements()
    .filter((record) => record.ownerWallet === ownerWallet)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function recordStellarSettlement(input: {
  ownerWallet: string;
  stellarAccount: string;
  txHash: string;
  confirmation: StellarPaymentResult | null;
  assetCode?: string;
  amount?: string | null;
  memo?: string | null;
}): StellarSettlementRecord {
  const txHash = input.txHash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(txHash)) {
    throw new Error('Enter a valid 64-character Stellar transaction hash.');
  }

  const records = readSettlements();
  const existingIndex = records.findIndex((record) => (
    record.ownerWallet === input.ownerWallet && record.txHash === txHash
  ));
  const now = new Date().toISOString();
  const previous = existingIndex >= 0 ? records[existingIndex] : null;
  const next: StellarSettlementRecord = {
    settlementId: previous?.settlementId ?? generateSettlementId(),
    ownerWallet: input.ownerWallet,
    stellarAccount: input.stellarAccount,
    txHash,
    status: statusFromConfirmation(input.confirmation),
    ledger: input.confirmation?.ledger ?? null,
    successful: input.confirmation?.successful ?? null,
    assetCode: input.assetCode ?? 'XLM',
    amount: input.amount ?? null,
    memo: input.memo ?? null,
    verifiedAt: input.confirmation ? now : null,
    createdAt: previous?.createdAt ?? now,
  };

  if (existingIndex >= 0) {
    records[existingIndex] = next;
  } else {
    records.push(next);
  }

  writeSettlements(records);
  return next;
}
