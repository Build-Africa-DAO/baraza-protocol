import {
  Horizon, Asset, Keypair, TransactionBuilder,
  Operation, Networks, BASE_FEE, Memo,
} from '@stellar/stellar-sdk';
import { BRZA_ASSET, STELLAR_ASSETS, type SupportedAsset } from '@/lib/brza/constants';
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

// ── DEX helpers ────────────────────────────────────────────────────────────

function buildAsset(code: SupportedAsset): Asset {
  if (code === 'XLM') return Asset.native();
  if (code === 'BRZA') return new Asset(BRZA_ASSET.code, BRZA_ASSET.issuerAddress);
  const asset = STELLAR_ASSETS[code];
  return new Asset(asset.code, asset.issuer as string);
}

function horizonAssetParams(code: SupportedAsset): Record<string, string> {
  if (code === 'XLM') return { asset_type: 'native' };
  if (code === 'BRZA') return { asset_type: 'credit_alphanum4', asset_code: BRZA_ASSET.code, asset_issuer: BRZA_ASSET.issuerAddress };
  const asset = STELLAR_ASSETS[code];
  const type = asset.code.length > 4 ? 'credit_alphanum12' : 'credit_alphanum4';
  return { asset_type: type, asset_code: asset.code, asset_issuer: asset.issuer as string };
}

interface HorizonAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

interface HorizonPathRecord {
  destination_amount: string;
  source_amount?: string;
  path: HorizonAsset[];
}

function horizonAssetToSdk(a: HorizonAsset): Asset {
  if (a.asset_type === 'native') return Asset.native();
  return new Asset(a.asset_code!, a.asset_issuer!);
}

async function resolvePathSend(
  sendAsset: SupportedAsset,
  sendAmount: string,
  receiveAsset: SupportedAsset,
): Promise<Asset[]> {
  const srcParams = horizonAssetParams(sendAsset);
  const dstParams = horizonAssetParams(receiveAsset);
  const dstAssetStr = dstParams.asset_type === 'native'
    ? 'native'
    : `${dstParams.asset_code}:${dstParams.asset_issuer}`;

  const qs = new URLSearchParams({
    source_asset_type: srcParams.asset_type,
    ...(srcParams.asset_code ? { source_asset_code: srcParams.asset_code } : {}),
    ...(srcParams.asset_issuer ? { source_asset_issuer: srcParams.asset_issuer } : {}),
    source_amount: sendAmount,
    destination_assets: dstAssetStr,
  });

  const res = await fetch(`${BRZA_ASSET.horizonUrl}/paths/strict-send?${qs}`);
  const data = await res.json() as { _embedded?: { records?: HorizonPathRecord[] } };
  const record = data._embedded?.records?.[0];
  return record?.path?.map(horizonAssetToSdk) ?? [];
}

async function resolvePathReceive(
  sendAsset: SupportedAsset,
  receiveAmount: string,
  receiveAsset: SupportedAsset,
): Promise<Asset[]> {
  const srcParams = horizonAssetParams(sendAsset);
  const dstParams = horizonAssetParams(receiveAsset);

  const srcAssetStr = srcParams.asset_type === 'native'
    ? 'native'
    : `${srcParams.asset_code}:${srcParams.asset_issuer}`;

  const qs = new URLSearchParams({
    destination_asset_type: dstParams.asset_type,
    ...(dstParams.asset_code ? { destination_asset_code: dstParams.asset_code } : {}),
    ...(dstParams.asset_issuer ? { destination_asset_issuer: dstParams.asset_issuer } : {}),
    destination_amount: receiveAmount,
    source_assets: srcAssetStr,
  });

  const res = await fetch(`${BRZA_ASSET.horizonUrl}/paths/strict-receive?${qs}`);
  const data = await res.json() as { _embedded?: { records?: HorizonPathRecord[] } };
  const record = data._embedded?.records?.[0];
  return record?.path?.map(horizonAssetToSdk) ?? [];
}

export async function swapExactSend(params: {
  fromSecret: string;
  sendAsset: SupportedAsset;
  sendAmount: string;
  receiveAsset: SupportedAsset;
  minReceive: string;
  destinationAddress?: string;
}): Promise<{ txHash: string; explorerUrl: string; error?: string }> {
  try {
    const kp = Keypair.fromSecret(params.fromSecret);
    const account = await server.loadAccount(kp.publicKey());
    const destination = params.destinationAddress ?? kp.publicKey();

    const path = await resolvePathSend(params.sendAsset, params.sendAmount, params.receiveAsset);

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.pathPaymentStrictSend({
        sendAsset: buildAsset(params.sendAsset),
        sendAmount: params.sendAmount,
        destination,
        destAsset: buildAsset(params.receiveAsset),
        destMin: params.minReceive,
        path,
      }))
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

export async function swapExactReceive(params: {
  fromSecret: string;
  sendAsset: SupportedAsset;
  maxSend: string;
  receiveAsset: SupportedAsset;
  receiveAmount: string;
  destinationAddress?: string;
}): Promise<{ txHash: string; explorerUrl: string; error?: string }> {
  try {
    const kp = Keypair.fromSecret(params.fromSecret);
    const account = await server.loadAccount(kp.publicKey());
    const destination = params.destinationAddress ?? kp.publicKey();

    const path = await resolvePathReceive(params.sendAsset, params.receiveAmount, params.receiveAsset);

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.pathPaymentStrictReceive({
        sendAsset: buildAsset(params.sendAsset),
        sendMax: params.maxSend,
        destination,
        destAsset: buildAsset(params.receiveAsset),
        destAmount: params.receiveAmount,
        path,
      }))
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

export async function getSwapQuote(params: {
  sendAsset: SupportedAsset;
  sendAmount: string;
  receiveAsset: SupportedAsset;
}): Promise<{ receiveAmount: string; rate: number; priceImpact: string | null; error?: string }> {
  try {
    const srcParams = horizonAssetParams(params.sendAsset);
    const dstParams = horizonAssetParams(params.receiveAsset);

    const dstAssetStr = dstParams.asset_type === 'native'
      ? 'native'
      : `${dstParams.asset_code}:${dstParams.asset_issuer}`;

    const qs = new URLSearchParams({
      source_asset_type: srcParams.asset_type,
      ...(srcParams.asset_code ? { source_asset_code: srcParams.asset_code } : {}),
      ...(srcParams.asset_issuer ? { source_asset_issuer: srcParams.asset_issuer } : {}),
      source_amount: params.sendAmount,
      destination_assets: dstAssetStr,
    });

    const res = await fetch(`${BRZA_ASSET.horizonUrl}/paths/strict-send?${qs}`);
    const data = await res.json() as { _embedded?: { records?: HorizonPathRecord[] } };

    if (!data._embedded?.records?.length) {
      return { receiveAmount: '0', rate: 0, priceImpact: null, error: 'No liquidity path found' };
    }

    const receiveAmount = data._embedded.records[0].destination_amount;
    const rate = parseFloat(receiveAmount) / parseFloat(params.sendAmount);
    return { receiveAmount, rate, priceImpact: null };
  } catch (e) {
    return { receiveAmount: '0', rate: 0, priceImpact: null, error: String(e) };
  }
}

export async function addUsdcTrustline(
  accountSecret: string
): Promise<{ txHash: string; error?: string }> {
  try {
    const kp = Keypair.fromSecret(accountSecret);
    const account = await server.loadAccount(kp.publicKey());

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.changeTrust({ asset: buildAsset('USDC') }))
      .setTimeout(30)
      .build();

    tx.sign(kp);
    const result = await server.submitTransaction(tx);
    return { txHash: result.hash };
  } catch (e) {
    return { txHash: '', error: String(e) };
  }
}

export async function getAllBalances(
  address: string
): Promise<{ xlm: string; brza: string; usdc: string; usdt: string; error?: string }> {
  try {
    const account = await server.loadAccount(address);
    const find = (code: string, issuer: string | null): string => {
      if (issuer === null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (account.balances as any[]).find((b) => b.asset_type === 'native')?.balance ?? '0';
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (account.balances as any[]).find(
        (b) => b.asset_code === code && b.asset_issuer === issuer
      )?.balance ?? '0';
    };

    return {
      xlm:  find('XLM', null),
      brza: find(BRZA_ASSET.code, BRZA_ASSET.issuerAddress),
      usdc: find('USDC', STELLAR_ASSETS.USDC.issuer),
      usdt: STELLAR_ASSETS.USDT.issuer ? find('USDT', STELLAR_ASSETS.USDT.issuer) : '0',
    };
  } catch (e) {
    return { xlm: '0', brza: '0', usdc: '0', usdt: '0', error: String(e) };
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
