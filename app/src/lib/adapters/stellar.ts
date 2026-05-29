import {
  Horizon, Asset, Keypair, TransactionBuilder,
  Operation, Networks, BASE_FEE, Memo,
} from '@stellar/stellar-sdk';
import { BRZA_ASSET } from '@/lib/brza/constants';
import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';

const server = new Horizon.Server(BRZA_ASSET.horizonUrl);
const NETWORK = BRZA_ASSET.network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
const getBrzaAsset = () => new Asset(BRZA_ASSET.code, BRZA_ASSET.issuerAddress || 'PLACEHOLDER');

export async function getBrzaBalance(
  address: string
): Promise<{ balance: string; formatted: string; error?: string }> {
  try {
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
  try {
    const kp = Keypair.fromSecret(params.fromSecret);
    const account = await server.loadAccount(kp.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.payment({
        destination: params.toAddress,
        asset: getBrzaAsset(),
        amount: params.amount,
      }))
      .addMemo(params.memo ? Memo.text(params.memo.slice(0, 28)) : Memo.none())
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
    const kp = Keypair.fromSecret(params.fromSecret);
    const account = await server.loadAccount(kp.publicKey());
    const batch = params.recipients.slice(0, 100);
    const builder = new TransactionBuilder(account, {
      fee: String(Number(BASE_FEE) * batch.length),
      networkPassphrase: NETWORK,
    });
    for (const r of batch) {
      builder.addOperation(Operation.payment({
        destination: r.address,
        asset: getBrzaAsset(),
        amount: r.amount,
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
}): Promise<{ address: string; txHash: string; error?: string }> {
  try {
    const newAccount = Keypair.random();
    const funder = Keypair.fromSecret(params.fundingSecret);
    const funderAccount = await server.loadAccount(funder.publicKey());

    const createTx = new TransactionBuilder(funderAccount, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.createAccount({ destination: newAccount.publicKey(), startingBalance: '3' }))
      .setTimeout(30).build();
    createTx.sign(funder, newAccount);
    await server.submitTransaction(createTx);

    const treasuryAccount = await server.loadAccount(newAccount.publicKey());
    const builder = new TransactionBuilder(treasuryAccount, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.setOptions({ lowThreshold: 1, medThreshold: params.threshold, highThreshold: params.threshold }))
      .addOperation(Operation.changeTrust({ asset: getBrzaAsset() }));

    for (const key of params.adminPublicKeys) {
      builder.addOperation(Operation.setOptions({ signer: { ed25519PublicKey: key, weight: 1 } }));
    }
    builder.addOperation(Operation.setOptions({ masterWeight: 0 }));

    const setupTx = builder.setTimeout(30).build();
    setupTx.sign(newAccount);
    const result = await server.submitTransaction(setupTx);

    return { address: newAccount.publicKey(), txHash: result.hash };
  } catch (e) {
    return { address: '', txHash: '', error: String(e) };
  }
}

export async function createBrzaTrustline(params: {
  accountSecret: string;
}): Promise<{ txHash: string; error?: string }> {
  try {
    const kp = Keypair.fromSecret(params.accountSecret);
    const account = await server.loadAccount(kp.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.changeTrust({ asset: getBrzaAsset() }))
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
    async pay(input): Promise<ChainActionResult> {
      const result = await sendBrza({
        fromSecret: '',
        toAddress: input.recipient,
        amount: input.amount,
        memo: input.communityId,
      });
      if (result.error) {
        return { ok: false, chain: 'stellar', error: result.error };
      }
      return { ok: true, chain: 'stellar', txHash: result.txHash };
    },
  },
};
