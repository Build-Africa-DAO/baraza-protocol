/**
 * Server-only BRZA mint helper. Submits a Stellar payment of BRZA from the
 * distributor account to a member's wallet. Used by the promote-orders cron
 * to settle pending mints; never imported by browser code.
 *
 * Why this lives here instead of importing app/src/lib/adapters/stellar.ts:
 * the adapter imports BRZA_ASSET from app/src/lib/brza/constants.ts, which
 * reads `import.meta.env` at module scope. That works in Vite browser
 * bundles, but breaks in a Vercel Node.js function. So we take all config
 * explicitly here — keeps the cron bundleable on the server runtime.
 *
 * Error classification matters: Horizon errors have different recovery
 * paths. `tx_bad_seq` is racy and worth retrying next tick; `op_no_trust`
 * means the recipient never opened a BRZA trustline and a retry will fail
 * the same way until they do. The cron uses this signal to decide whether
 * to leave the order at MINT_QUEUED (retriable) or mark MINT_FAILED_FINAL
 * (terminal).
 */

import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

export type StellarNetworkName = 'mainnet' | 'testnet';

export interface MintBrzaParams {
  /** Stellar S... secret key for the distributor account. */
  distributorSecret: string;
  /** Stellar G... public key for the BRZA asset issuer. */
  issuerPublicKey: string;
  /** Recipient wallet address (G...). */
  recipient: string;
  /** BRZA amount as a decimal string. Will be normalized to 7 decimals. */
  amount: string;
  /** Memo text (≤28 bytes). Use payment order_id for idempotency tracing. */
  memo?: string;
  /** Horizon URL — use the matching network. */
  horizonUrl: string;
  /** `mainnet` selects PUBLIC passphrase, otherwise TESTNET. */
  network: StellarNetworkName;
}

export type MintBrzaResult =
  | { ok: true; txHash: string }
  | { ok: false; error: string; retriable: boolean };

/**
 * Horizon op result codes that have no chance of succeeding on retry.
 * Everything else is treated as retriable (network blip, sequence race,
 * unknown 5xx, etc.).
 */
const TERMINAL_OP_CODES = new Set([
  'op_no_trust',         // Recipient has no BRZA trustline
  'op_no_issuer',        // Issuer account missing (config bug)
  'op_underfunded',      // Distributor lacks BRZA — operator must refill
  'op_line_full',        // Recipient trustline limit hit
  'op_src_no_trust',     // Distributor itself has no trustline
  'op_no_destination',   // Recipient account does not exist
  'op_malformed',        // Bad address or amount — config bug
]);

const TERMINAL_TX_CODES = new Set([
  'tx_no_source_account', // Distributor account missing
  'tx_insufficient_fee',  // Wallet of fees — but we use BASE_FEE; would be a config bug
  'tx_malformed',
]);

function normalizeAmount(amount: string): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error('BRZA amount must be a positive number');
  }
  return numeric.toFixed(7).replace(/\.?0+$/, '');
}

function buildMemo(memo: string | undefined): Memo {
  if (!memo) return Memo.none();
  if (new TextEncoder().encode(memo).length > 28) {
    throw new Error('Stellar memo text cannot exceed 28 bytes.');
  }
  return Memo.text(memo);
}

function passphrase(network: StellarNetworkName): string {
  return network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}

/**
 * Inspect a thrown Horizon error and classify retriability. The SDK throws
 * `BadResponseError` with a nested `extras.result_codes` shape — we look at
 * the op codes first (more specific), then the tx code.
 */
export function classifyMintError(error: unknown): { message: string; retriable: boolean } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = error as any;
  const extras = anyErr?.response?.data?.extras ?? anyErr?.extras;
  const opCodes: string[] = Array.isArray(extras?.result_codes?.operations)
    ? extras.result_codes.operations
    : [];
  const txCode: string | undefined = extras?.result_codes?.transaction;

  for (const code of opCodes) {
    if (code && TERMINAL_OP_CODES.has(code)) {
      return { message: `Stellar op error: ${code}`, retriable: false };
    }
  }
  if (txCode && TERMINAL_TX_CODES.has(txCode)) {
    return { message: `Stellar tx error: ${txCode}`, retriable: false };
  }

  const message = anyErr?.message ?? String(error);
  return { message, retriable: true };
}

export async function mintBrzaPayment(params: MintBrzaParams): Promise<MintBrzaResult> {
  let distributor: Keypair;
  let asset: Asset;
  let amount: string;
  let memo: Memo;
  try {
    distributor = Keypair.fromSecret(params.distributorSecret);
    // Validate issuer + recipient addresses; cheap pre-flight before hitting Horizon.
    Keypair.fromPublicKey(params.issuerPublicKey);
    Keypair.fromPublicKey(params.recipient);
    asset = new Asset('BRZA', params.issuerPublicKey);
    amount = normalizeAmount(params.amount);
    memo = buildMemo(params.memo);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      retriable: false, // Bad config — retry will fail the same way
    };
  }

  try {
    const server = new Horizon.Server(params.horizonUrl);
    const account = await server.loadAccount(distributor.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: passphrase(params.network),
    })
      .addOperation(
        Operation.payment({
          destination: params.recipient,
          asset,
          amount,
        }),
      )
      .addMemo(memo)
      .setTimeout(30)
      .build();
    tx.sign(distributor);
    const result = await server.submitTransaction(tx);
    return { ok: true, txHash: result.hash };
  } catch (err) {
    const { message, retriable } = classifyMintError(err);
    return { ok: false, error: message, retriable };
  }
}
