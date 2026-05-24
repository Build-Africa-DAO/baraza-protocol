import {
  Asset,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

export type StellarNetwork = 'testnet' | 'mainnet' | 'custom';

export interface StellarConfig {
  enabled: boolean;
  network: StellarNetwork;
  horizonUrl: string;
  networkPassphrase: string;
}

export interface StellarBalance {
  assetCode: string;
  assetIssuer: string | null;
  balance: string;
  type: string;
}

export interface StellarPaymentInput {
  sourceSecret: string;
  destination: string;
  amount: string;
  memoText?: string;
}

export interface StellarPaymentResult {
  hash: string;
  ledger: number;
  successful: boolean;
}

interface ConfirmTransactionServer {
  transactions: () => {
    transaction: (hash: string) => {
      call: () => Promise<StellarPaymentResult>;
    };
  };
}

const DEFAULT_TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';
const DEFAULT_MAINNET_HORIZON = 'https://horizon.stellar.org';

function parseNetwork(raw: string | undefined): StellarNetwork {
  if (raw === 'mainnet' || raw === 'custom') return raw;
  return 'testnet';
}

export function getStellarConfig(): StellarConfig {
  const network = parseNetwork(import.meta.env.VITE_STELLAR_NETWORK);
  const envHorizon = import.meta.env.VITE_STELLAR_HORIZON_URL?.trim();
  const envPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE?.trim();
  const horizonUrl = envHorizon || (network === 'mainnet' ? DEFAULT_MAINNET_HORIZON : DEFAULT_TESTNET_HORIZON);
  const networkPassphrase =
    envPassphrase || (network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET);

  return {
    enabled: Boolean(envHorizon || import.meta.env.VITE_STELLAR_NETWORK),
    network,
    horizonUrl,
    networkPassphrase,
  };
}

export function isValidStellarPublicKey(accountId: string): boolean {
  return StrKey.isValidEd25519PublicKey(accountId);
}

export function isValidStellarSecret(seed: string): boolean {
  return StrKey.isValidEd25519SecretSeed(seed);
}

export function normaliseStellarAmount(amount: string | number): string {
  const numeric = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error('Stellar amount must be greater than zero.');
  }
  return numeric.toFixed(7).replace(/\.?0+$/, '');
}

export function memoFromText(memoText: string | undefined): Memo | undefined {
  const value = memoText?.trim();
  if (!value) return undefined;
  if (new TextEncoder().encode(value).length > 28) {
    throw new Error('Stellar memo text cannot exceed 28 bytes.');
  }
  return Memo.text(value);
}

function createServer(config = getStellarConfig()): Horizon.Server {
  return new Horizon.Server(config.horizonUrl);
}

export async function fetchStellarBalances(
  accountId: string,
  config = getStellarConfig(),
): Promise<StellarBalance[]> {
  if (!isValidStellarPublicKey(accountId)) {
    throw new Error('Invalid Stellar account address.');
  }

  const account = await createServer(config).loadAccount(accountId);
  return account.balances.map((entry) => ({
    assetCode: 'asset_code' in entry ? entry.asset_code : 'XLM',
    assetIssuer: 'asset_issuer' in entry ? entry.asset_issuer : null,
    balance: entry.balance,
    type: entry.asset_type,
  }));
}

export async function confirmStellarTransaction(
  txHash: string,
  config = getStellarConfig(),
  server: ConfirmTransactionServer = createServer(config),
): Promise<StellarPaymentResult | null> {
  const hash = txHash.trim();
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    throw new Error('Invalid Stellar transaction hash.');
  }

  try {
    const tx = await server.transactions().transaction(hash).call();
    return {
      hash: tx.hash,
      ledger: tx.ledger,
      successful: tx.successful,
    };
  } catch {
    return null;
  }
}

export async function submitTestnetXlmPayment(
  input: StellarPaymentInput,
  config = getStellarConfig(),
): Promise<StellarPaymentResult> {
  if (config.network !== 'testnet') {
    throw new Error('submitTestnetXlmPayment is only enabled on Stellar testnet.');
  }
  if (!isValidStellarSecret(input.sourceSecret)) {
    throw new Error('Invalid Stellar source secret.');
  }
  if (!isValidStellarPublicKey(input.destination)) {
    throw new Error('Invalid Stellar destination address.');
  }

  const source = Keypair.fromSecret(input.sourceSecret);
  const server = createServer(config);
  const account = await server.loadAccount(source.publicKey());
  const fee = await server.fetchBaseFee();
  const memo = memoFromText(input.memoText);

  const builder = new TransactionBuilder(account, {
    fee: String(fee),
    networkPassphrase: config.networkPassphrase,
  }).addOperation(
    Operation.payment({
      destination: input.destination,
      asset: Asset.native(),
      amount: normaliseStellarAmount(input.amount),
    }),
  );

  const tx = (memo ? builder.addMemo(memo) : builder).setTimeout(60).build();
  tx.sign(source);

  const result = await server.submitTransaction(tx);
  return {
    hash: result.hash,
    ledger: result.ledger,
    successful: result.successful,
  };
}
