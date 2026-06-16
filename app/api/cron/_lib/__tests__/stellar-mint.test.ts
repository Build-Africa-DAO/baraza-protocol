// @vitest-environment node
// jsdom's @noble/curves shim rejects Stellar SDK's keypair internals
// ("private key must be hex string or Uint8Array"). Node env gives the real
// crypto primitives the SDK expects.

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Horizon } from '@stellar/stellar-sdk';
import {
  classifyMintError,
  confirmMintTransaction,
  mintBrzaBatch,
  mintBrzaPayment,
  STELLAR_MAX_OPS_PER_TX,
} from '../stellar-mint';

// Valid Stellar testnet keypairs generated once with Keypair.random() and
// hardcoded. These are throwaway testnet identities — no real funds attached.
const DISTRIBUTOR_SECRET = 'SC4SSRXENWGWBMIUJ3OAHCL6DX3XQPSIZ2SUTIDX4SW6R37D3FYMCHWR';
// Corresponding pubkey: GAESNHZI4CXHMFKXERSB7JHRJDOBLB2TJ6RAUJBODVEVIKOXM5YPYDA4
const ISSUER_PK          = 'GD76BGUMMHI4YVE3ZQALY3MKFZYODK37MGAQYVYR5HDLQJT75ZE3Q2C7';
const RECIPIENT_PK       = 'GBSKKK4TXPM5HSMDXZGLZLHH6ZWW7ON5Q3EU6R5Y27MFHLVV4TYGQTNW';

const baseParams = {
  distributorSecret: DISTRIBUTOR_SECRET,
  issuerPublicKey: ISSUER_PK,
  recipient: RECIPIENT_PK,
  amount: '100',
  memo: 'ord_test',
  // Bogus URL so any code path that escapes pre-flight will fail at fetch
  // time rather than hitting real Horizon during tests.
  horizonUrl: 'http://127.0.0.1:1/horizon-unreachable',
  network: 'testnet' as const,
};

// Suppress noisy console output from the SDK's fetch retry inside the
// Horizon-blip test. We assert on result shape, not console output.
const QUIET_PARAMS = { ...baseParams };

describe('mintBrzaPayment — pre-flight validation (no Horizon call)', () => {
  it('rejects an invalid distributor secret as terminal', async () => {
    const result = await mintBrzaPayment({ ...QUIET_PARAMS, distributorSecret: 'not-a-secret' });

    expect(result).toMatchObject({ ok: false, retriable: false });
  });

  it('rejects an invalid issuer public key as terminal', async () => {
    const result = await mintBrzaPayment({ ...QUIET_PARAMS, issuerPublicKey: 'GBOGUS' });

    expect(result).toMatchObject({ ok: false, retriable: false });
  });

  it('rejects an invalid recipient address as terminal', async () => {
    const result = await mintBrzaPayment({ ...QUIET_PARAMS, recipient: 'not-a-key' });

    expect(result).toMatchObject({ ok: false, retriable: false });
  });

  it('rejects zero amount as terminal', async () => {
    const result = await mintBrzaPayment({ ...QUIET_PARAMS, amount: '0' });

    expect(result).toMatchObject({
      ok: false,
      retriable: false,
      error: expect.stringMatching(/positive number/i),
    });
  });

  it('rejects negative amount as terminal', async () => {
    const result = await mintBrzaPayment({ ...QUIET_PARAMS, amount: '-5' });

    expect(result).toMatchObject({ ok: false, retriable: false });
  });

  it('rejects non-numeric amount as terminal', async () => {
    const result = await mintBrzaPayment({ ...QUIET_PARAMS, amount: 'abc' });

    expect(result).toMatchObject({ ok: false, retriable: false });
  });

  it('rejects oversized memo as terminal (>28 bytes)', async () => {
    const tooLong = 'a'.repeat(29);
    const result = await mintBrzaPayment({ ...QUIET_PARAMS, memo: tooLong });

    expect(result).toMatchObject({
      ok: false,
      retriable: false,
      error: expect.stringMatching(/28 bytes/i),
    });
  });
});

describe('classifyMintError — Horizon error decoding', () => {
  function horizonResponse(opCodes: string[] | undefined, txCode?: string) {
    return {
      response: {
        data: {
          extras: {
            result_codes: {
              ...(txCode !== undefined ? { transaction: txCode } : {}),
              ...(opCodes !== undefined ? { operations: opCodes } : {}),
            },
          },
        },
      },
      message: 'Stellar transaction failed',
    };
  }

  // ── Terminal op codes — recipient/distributor account state ─────────────

  it('classifies op_no_trust as TERMINAL (recipient never opened a BRZA trustline)', () => {
    const result = classifyMintError(horizonResponse(['op_no_trust']));
    expect(result).toEqual({ message: 'Stellar op error: op_no_trust', retriable: false });
  });

  it('classifies op_underfunded as TERMINAL (operator must refill distributor)', () => {
    const result = classifyMintError(horizonResponse(['op_underfunded']));
    expect(result).toEqual({ message: 'Stellar op error: op_underfunded', retriable: false });
  });

  it('classifies op_no_destination as TERMINAL (recipient account does not exist)', () => {
    const result = classifyMintError(horizonResponse(['op_no_destination']));
    expect(result).toEqual({ message: 'Stellar op error: op_no_destination', retriable: false });
  });

  it('classifies op_line_full as TERMINAL (recipient trustline at limit)', () => {
    const result = classifyMintError(horizonResponse(['op_line_full']));
    expect(result.retriable).toBe(false);
  });

  it('classifies op_no_issuer as TERMINAL (issuer account missing — config bug)', () => {
    const result = classifyMintError(horizonResponse(['op_no_issuer']));
    expect(result.retriable).toBe(false);
  });

  it('classifies op_src_no_trust as TERMINAL (distributor itself has no BRZA trustline)', () => {
    const result = classifyMintError(horizonResponse(['op_src_no_trust']));
    expect(result.retriable).toBe(false);
  });

  it('classifies op_malformed as TERMINAL (bad address or amount — config bug)', () => {
    const result = classifyMintError(horizonResponse(['op_malformed']));
    expect(result.retriable).toBe(false);
  });

  // ── Terminal tx codes ────────────────────────────────────────────────────

  it('classifies tx_no_source_account as TERMINAL (distributor account missing)', () => {
    const result = classifyMintError(horizonResponse(undefined, 'tx_no_source_account'));
    expect(result).toEqual({
      message: 'Stellar tx error: tx_no_source_account',
      retriable: false,
    });
  });

  it('classifies tx_malformed as TERMINAL', () => {
    const result = classifyMintError(horizonResponse(undefined, 'tx_malformed'));
    expect(result.retriable).toBe(false);
  });

  // ── Retriable cases ──────────────────────────────────────────────────────

  it('classifies tx_bad_seq as RETRIABLE (sequence race — next tick retries)', () => {
    const result = classifyMintError(horizonResponse([], 'tx_bad_seq'));
    expect(result.retriable).toBe(true);
  });

  it('classifies unknown op codes as RETRIABLE (better to retry than burn the order)', () => {
    const result = classifyMintError(horizonResponse(['op_unknown_future_code']));
    expect(result.retriable).toBe(true);
  });

  it('classifies plain network errors (no result_codes) as RETRIABLE', () => {
    const networkErr = Object.assign(new Error('ETIMEDOUT'), { message: 'ETIMEDOUT' });
    const result = classifyMintError(networkErr);
    expect(result).toEqual({ message: 'ETIMEDOUT', retriable: true });
  });

  // ── Defensive: oddly-shaped errors ───────────────────────────────────────

  it('treats unknown error shapes as retriable (better to retry than burn the order)', () => {
    expect(classifyMintError(new Error('boom'))).toEqual({ message: 'boom', retriable: true });
  });

  it('handles raw strings without crashing', () => {
    const result = classifyMintError('something broke');
    expect(result.retriable).toBe(true);
  });

  it('handles null/undefined without crashing', () => {
    expect(classifyMintError(null).retriable).toBe(true);
    expect(classifyMintError(undefined).retriable).toBe(true);
  });

  it('reads result_codes off SDK BadResponseError shape (extras at top level)', () => {
    const sdkError = {
      extras: { result_codes: { operations: ['op_line_full'] } },
    };
    expect(classifyMintError(sdkError)).toEqual({
      message: 'Stellar op error: op_line_full',
      retriable: false,
    });
  });

  it('picks the first terminal op code when multiple are present', () => {
    const result = classifyMintError(horizonResponse(['op_success', 'op_no_trust']));
    expect(result).toEqual({ message: 'Stellar op error: op_no_trust', retriable: false });
  });
});

describe('confirmMintTransaction — Horizon lookup', () => {
  const HORIZON_URL = 'https://horizon-testnet.stellar.org';
  const TX_HASH = 'a'.repeat(64);

  // Spy that we install on Horizon.Server.prototype.transactions for each
  // test. Returns a chainable builder whose .call() resolves/rejects as
  // configured. Using prototype-spy avoids needing to mock the SDK module.
  function stubTransactions(behavior: () => Promise<unknown>) {
    const builder = { call: vi.fn(behavior) };
    const transactionBuilder = { transaction: vi.fn(() => builder) };
    return vi
      .spyOn(Horizon.Server.prototype, 'transactions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue(transactionBuilder as any);
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns confirmed when Horizon reports successful=true', async () => {
    stubTransactions(async () => ({ successful: true, ledger: 12345 }));

    const result = await confirmMintTransaction(HORIZON_URL, TX_HASH);

    expect(result).toEqual({ status: 'confirmed', ledger: 12345 });
  });

  it('returns failed when Horizon reports successful=false (tx reverted)', async () => {
    stubTransactions(async () => ({
      successful: false,
      ledger: 12345,
      result_xdr: 'AAAAAA==',
    }));

    const result = await confirmMintTransaction(HORIZON_URL, TX_HASH);

    expect(result).toMatchObject({ status: 'failed' });
    if (result.status === 'failed') {
      expect(result.error).toMatch(/ledger 12345/);
      expect(result.error).toMatch(/AAAAAA==/);
    }
  });

  it('returns pending when Horizon throws 404 (tx not yet propagated)', async () => {
    stubTransactions(async () => {
      const err = Object.assign(new Error('Not Found'), {
        name: 'NotFoundError',
        response: { status: 404 },
      });
      throw err;
    });

    const result = await confirmMintTransaction(HORIZON_URL, TX_HASH);

    expect(result).toEqual({ status: 'pending' });
  });

  it('returns pending on network error so the next tick retries', async () => {
    stubTransactions(async () => {
      throw new Error('ETIMEDOUT');
    });

    const result = await confirmMintTransaction(HORIZON_URL, TX_HASH);

    expect(result).toEqual({ status: 'pending' });
  });

  it('returns failed (not pending) when tx hash is empty — defensive guard', async () => {
    const result = await confirmMintTransaction(HORIZON_URL, '');

    expect(result).toMatchObject({ status: 'failed', error: expect.stringMatching(/missing/i) });
  });
});

describe('mintBrzaBatch — pre-flight validation (no Horizon call)', () => {
  const ENTRY = { recipient: RECIPIENT_PK, amount: '50' };
  const batchParams = {
    distributorSecret: DISTRIBUTOR_SECRET,
    issuerPublicKey: ISSUER_PK,
    entries: [ENTRY, ENTRY],
    memo: 'batch:2',
    horizonUrl: 'http://127.0.0.1:1/horizon-unreachable',
    network: 'testnet' as const,
  };

  it('rejects an empty batch as terminal', async () => {
    const result = await mintBrzaBatch({ ...batchParams, entries: [] });

    expect(result).toMatchObject({ ok: false, retriable: false, error: expect.stringMatching(/empty/i) });
  });

  it(`rejects a batch exceeding ${STELLAR_MAX_OPS_PER_TX} ops as terminal`, async () => {
    const tooMany = Array(STELLAR_MAX_OPS_PER_TX + 1).fill(ENTRY);
    const result = await mintBrzaBatch({ ...batchParams, entries: tooMany });

    expect(result).toMatchObject({
      ok: false,
      retriable: false,
      error: expect.stringMatching(/exceeds Stellar/i),
    });
  });

  it('rejects an invalid distributor secret as terminal', async () => {
    const result = await mintBrzaBatch({ ...batchParams, distributorSecret: 'not-a-secret' });

    expect(result).toMatchObject({ ok: false, retriable: false });
  });

  it('rejects a recipient with a malformed public key as terminal', async () => {
    const result = await mintBrzaBatch({
      ...batchParams,
      entries: [ENTRY, { recipient: 'GBOGUS', amount: '50' }],
    });

    expect(result).toMatchObject({ ok: false, retriable: false });
  });

  it('rejects a non-positive amount in any entry as terminal', async () => {
    const result = await mintBrzaBatch({
      ...batchParams,
      entries: [ENTRY, { recipient: RECIPIENT_PK, amount: '0' }],
    });

    expect(result).toMatchObject({
      ok: false,
      retriable: false,
      error: expect.stringMatching(/positive number/i),
    });
  });

  it('rejects a memo over 28 bytes as terminal', async () => {
    const result = await mintBrzaBatch({ ...batchParams, memo: 'a'.repeat(29) });

    expect(result).toMatchObject({
      ok: false,
      retriable: false,
      error: expect.stringMatching(/28 bytes/i),
    });
  });
});
