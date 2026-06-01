import {
  Horizon, Asset, Keypair, TransactionBuilder,
  Operation, Networks, BASE_FEE, Memo,
} from '@stellar/stellar-sdk';
import { BRZA_ASSET } from '@/lib/brza/constants';
import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';

const server = new Horizon.Server(BRZA_ASSET.horizonUrl);
const NETWORK = BRZA_ASSET.network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

function requirePublicKey(address: string, label: string): string {
  try {
    return Keypair.fromPublicKey(address).publicKey();
  } catch {
    throw new Error(`${label} must be a valid Stellar G-account.`);
  }
}

function requirePositiveAmount(amount: string): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error('BRZA amount must be greater than zero.');
  }
  return numeric.toFixed(7).replace(/\.?0+$/, '');
}

function requireMemo(memo: string | undefined): Memo {
  if (!memo) return Memo.none();
  if (new TextEncoder().encode(memo).length > 28) {
    throw new Error('Stellar memo text cannot exceed 28 bytes.');
  }
  return Memo.text(memo);
}

export function getBrzaAsset(): Asset {
  const issuer = requirePublicKey(BRZA_ASSET.issuerAddress, 'BRZA issuer address');
  return new Asset(BRZA_ASSET.code, issuer);
}

export function minimumTreasuryStartingBalance(adminCount: number): string {
  if (!Number.isInteger(adminCount) || adminCount < 1) {
    throw new Error('Treasury must have at least one admin signer.');
  }
  // Covers account reserve, trustline, signer entries, fees, and a reserve buffer.
  return String(Math.max(5, 3 + adminCount));
}

export async function getBrzaBalance(
  address: string
): Promise<{ balance: string; formatted: string; error?: string }> {
  try {
    requirePublicKey(address, 'Stellar account address');
    getBrzaAsset();
    const account = await server.loadAccount(address);
    const b = account.balances.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (x: any) => x.asset_code === BRZA_ASSET.code && x.asset_issuer === BRZA_ASSET.issuerAddress
    );
    const balance = b?.balance ?? '0';
    return { balance, formatted: `${parseFloat(balance).toLocaleString()} BRZA` };
  } catch (e) {
    return { balance: '0', formatted: '0 BRZA', error: String(e) };
  }
}

export async function getXlmBalance(
  address: string
): Promise<{ balance: string; error?: string }> {
  try {
    requirePublicKey(address, 'Stellar account address');
    const account = await server.loadAccount(address);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xlm = account.balances.find((x: any) => x.asset_type === 'native');
    return { balance: xlm?.balance ?? '0' };
  } catch (e) {
    return { balance: '0', error: String(e) };
  }
}

export async function sendBrza(params: {
  fromSecret: string;
  toAddress: string;
  amount: string;
  memo?: string;
}): Promise<{ txHash: string; explorerUrl: string; error?: string }> {
  // Secret-based helpers are server-orchestration building blocks. UI adapters
  // must never inject or request custody secrets from browser callers.
  try {
    const kp = Keypair.fromSecret(params.fromSecret);
    const destination = requirePublicKey(params.toAddress, 'BRZA payment destination');
    const amount = requirePositiveAmount(params.amount);
    const memo = requireMemo(params.memo);
    const asset = getBrzaAsset();
    const account = await server.loadAccount(kp.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.payment({
        destination,
        asset,
        amount,
      }))
      .addMemo(memo)
      .setTimeout(30)
      .build();
    tx.sign(kp);
    const result = await server.submitTransaction(tx);
    const base = BRZA_ASSET.network === 'mainnet'
      ? 'https://stellar.expert/explorer/public/tx'
      : 'https://stellar.expert/explorer/testnet/tx';
    return { txHash: result.hash, explorerUrl: `${base}/${result.hash}` };
  } catch (e) {
    return { txHash: '', explorerUrl: '', error: String(e) };
  }
}

export async function massPay(params: {
  fromSecret: string;
  recipients: { address: string; amount: string }[];
}): Promise<{ txHash: string; count: number; error?: string }> {
  try {
    if (params.recipients.length < 1) throw new Error('At least one BRZA recipient is required.');
    if (params.recipients.length > 100) throw new Error('BRZA mass payments support at most 100 recipients per transaction.');
    const kp = Keypair.fromSecret(params.fromSecret);
    const asset = getBrzaAsset();
    const account = await server.loadAccount(kp.publicKey());
    const batch = params.recipients;
    const builder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK,
    });
    for (const r of batch) {
      builder.addOperation(Operation.payment({
        destination: requirePublicKey(r.address, 'BRZA payment destination'),
        asset,
        amount: requirePositiveAmount(r.amount),
      }));
    }
    const tx = builder.setTimeout(60).build();
    tx.sign(kp);
    const result = await server.submitTransaction(tx);
    return { txHash: result.hash, count: batch.length };
  } catch (e) {
    return { txHash: '', count: 0, error: String(e) };
  }
}

export async function createCommunityTreasury(params: {
  adminPublicKeys: string[];
  threshold: number;
  fundingSecret: string;
}): Promise<{ address: string; txHash: string; recoverySecret?: string; error?: string }> {
  // This must run in a trusted server workflow so partial setup recovery
  // material can be stored securely.
  let createdAccount: Keypair | undefined;
  try {
    const admins = [...new Set(params.adminPublicKeys.map((key) => requirePublicKey(key, 'Treasury admin signer')))];
    if (admins.length !== params.adminPublicKeys.length) throw new Error('Treasury admin signers must be unique.');
    if (!Number.isInteger(params.threshold) || params.threshold < 1 || params.threshold > admins.length) {
      throw new Error('Treasury threshold must be between 1 and the number of admin signers.');
    }
    getBrzaAsset();
    const newAccount = Keypair.random();
    const funder = Keypair.fromSecret(params.fundingSecret);
    const funderAccount = await server.loadAccount(funder.publicKey());

    const createTx = new TransactionBuilder(funderAccount, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.createAccount({
        destination: newAccount.publicKey(),
        startingBalance: minimumTreasuryStartingBalance(admins.length),
      }))
      .setTimeout(30).build();
    createTx.sign(funder);
    await server.submitTransaction(createTx);
    createdAccount = newAccount;

    const treasuryAccount = await server.loadAccount(newAccount.publicKey());
    const builder = new TransactionBuilder(treasuryAccount, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.setOptions({ lowThreshold: 1, medThreshold: params.threshold, highThreshold: params.threshold }))
      .addOperation(Operation.changeTrust({ asset: getBrzaAsset() }));

    for (const key of admins) {
      builder.addOperation(Operation.setOptions({ signer: { ed25519PublicKey: key, weight: 1 } }));
    }
    builder.addOperation(Operation.setOptions({ masterWeight: 0 }));

    const setupTx = builder.setTimeout(30).build();
    setupTx.sign(newAccount);
    const result = await server.submitTransaction(setupTx);

    return { address: newAccount.publicKey(), txHash: result.hash };
  } catch (e) {
    return {
      address: createdAccount?.publicKey() ?? '',
      txHash: '',
      recoverySecret: createdAccount?.secret(),
      error: String(e),
    };
  }
}

export async function createBrzaTrustline(params: {
  accountSecret: string;
}): Promise<{ txHash: string; error?: string }> {
  try {
    const kp = Keypair.fromSecret(params.accountSecret);
    const asset = getBrzaAsset();
    const account = await server.loadAccount(kp.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.changeTrust({ asset }))
      .setTimeout(30).build();
    tx.sign(kp);
    const result = await server.submitTransaction(tx);
    return { txHash: result.hash };
  } catch (e) {
    return { txHash: '', error: String(e) };
  }
}

export const stellarAdapter: ChainAdapter = {
  chain: 'stellar',
  treasury: {
    async pay(): Promise<ChainActionResult> {
      return {
        ok: false,
        chain: 'stellar',
        error: 'Stellar treasury payments require trusted server signing.',
      };
    },
  },
};
