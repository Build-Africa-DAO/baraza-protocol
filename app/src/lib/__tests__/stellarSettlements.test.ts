import { describe, expect, it } from 'vitest';
import {
  listStellarSettlements,
  recordStellarSettlement,
} from '@/lib/stellarSettlements';

const OWNER = 'solana-wallet-1';
const ACCOUNT = 'GBEQEOORBLDGA36MBIYBS2XI7YLT23BDJRBDNWP5RGDB6BFFRHWEBAHD';
const HASH = 'a'.repeat(64);

describe('Stellar settlements', () => {
  it('starts empty for a wallet', () => {
    expect(listStellarSettlements(OWNER)).toEqual([]);
  });

  it('records a confirmed settlement', () => {
    const record = recordStellarSettlement({
      ownerWallet: OWNER,
      stellarAccount: ACCOUNT,
      txHash: HASH,
      confirmation: { hash: HASH, ledger: 42, successful: true },
    });

    expect(record.status).toBe('CONFIRMED');
    expect(record.ledger).toBe(42);
    expect(listStellarSettlements(OWNER)).toHaveLength(1);
  });

  it('records not found when confirmation is null', () => {
    const record = recordStellarSettlement({
      ownerWallet: OWNER,
      stellarAccount: ACCOUNT,
      txHash: 'b'.repeat(64),
      confirmation: null,
    });

    expect(record.status).toBe('NOT_FOUND');
    expect(record.verifiedAt).toBeNull();
  });

  it('updates an existing transaction hash for the same owner', () => {
    const first = recordStellarSettlement({
      ownerWallet: OWNER,
      stellarAccount: ACCOUNT,
      txHash: HASH,
      confirmation: null,
    });
    const second = recordStellarSettlement({
      ownerWallet: OWNER,
      stellarAccount: ACCOUNT,
      txHash: HASH,
      confirmation: { hash: HASH, ledger: 99, successful: true },
    });

    expect(second.settlementId).toBe(first.settlementId);
    expect(second.status).toBe('CONFIRMED');
    expect(listStellarSettlements(OWNER)).toHaveLength(1);
  });

  it('rejects malformed transaction hashes', () => {
    expect(() => recordStellarSettlement({
      ownerWallet: OWNER,
      stellarAccount: ACCOUNT,
      txHash: 'bad',
      confirmation: null,
    })).toThrow(/transaction hash/i);
  });
});
