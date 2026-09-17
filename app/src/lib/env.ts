/**
 * Public (VITE_*) environment, validated once at startup.
 *
 * Hand-rolled on purpose: this module sits on the visitor critical path
 * (main.tsx, seo.ts) and the schema library it used to lean on cost 18 KiB
 * gzipped for nine string fields. The checks are the same: URLs must parse,
 * enums must match, and anything else falls back to the documented default.
 */
type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet' | 'mainnet-beta';
type StellarNetwork = 'testnet' | 'mainnet';

export interface PublicEnv {
  VITE_SITE_URL: string;
  VITE_SOLANA_NETWORK: SolanaNetwork;
  VITE_RPC_ENDPOINT: string;
  VITE_STELLAR_NETWORK: StellarNetwork;
  VITE_STELLAR_HORIZON_URL: string;
  VITE_STELLAR_NETWORK_PASSPHRASE: string;
  VITE_WALLETCONNECT_PROJECT_ID?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

type RawEnv = Record<string, unknown>;

function text(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** A parseable http(s) URL without its trailing slash, else undefined. */
function url(raw: unknown): string | undefined {
  const value = text(raw);
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
  } catch {
    return undefined;
  }
  return value.replace(/\/$/, '');
}

function oneOf<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const value = text(raw);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const SOLANA_NETWORKS: readonly SolanaNetwork[] = ['devnet', 'testnet', 'mainnet', 'mainnet-beta'];
const STELLAR_NETWORKS: readonly StellarNetwork[] = ['testnet', 'mainnet'];

export function parsePublicEnv(raw: RawEnv): PublicEnv {
  const solanaSetting = oneOf(raw.VITE_SOLANA_NETWORK, SOLANA_NETWORKS, 'devnet');
  const solanaNetwork = solanaSetting === 'mainnet' ? 'mainnet-beta' : solanaSetting;
  const solanaRpc = solanaNetwork === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : `https://api.${solanaNetwork}.solana.com`;
  const stellarNetwork = oneOf(raw.VITE_STELLAR_NETWORK, STELLAR_NETWORKS, 'testnet');
  const stellarMainnet = stellarNetwork === 'mainnet';

  return {
    VITE_SITE_URL: url(raw.VITE_SITE_URL) ?? 'https://barazaprotocol.com',
    VITE_SOLANA_NETWORK: solanaSetting,
    VITE_RPC_ENDPOINT: url(raw.VITE_RPC_ENDPOINT) ?? solanaRpc,
    VITE_STELLAR_NETWORK: stellarNetwork,
    VITE_STELLAR_HORIZON_URL: url(raw.VITE_STELLAR_HORIZON_URL) ??
      (stellarMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'),
    VITE_STELLAR_NETWORK_PASSPHRASE: text(raw.VITE_STELLAR_NETWORK_PASSPHRASE) ??
      (stellarMainnet ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015'),
    VITE_WALLETCONNECT_PROJECT_ID: text(raw.VITE_WALLETCONNECT_PROJECT_ID),
    VITE_SUPABASE_URL: url(raw.VITE_SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY: text(raw.VITE_SUPABASE_ANON_KEY),
  };
}

export function validatePublicEnv(): PublicEnv {
  const env = parsePublicEnv(import.meta.env as RawEnv);
  const warnings: string[] = [];
  if (!env.VITE_WALLETCONNECT_PROJECT_ID) {
    warnings.push('VITE_WALLETCONNECT_PROJECT_ID is not set; mobile wallet deep-link support may be limited.');
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    warnings.push('Supabase public env is not set; deployed data persistence will fall back to local/mock data.');
  }
  warnings.forEach((warning) => console.warn(`[baraza env] ${warning}`));
  return env;
}

let publicEnv: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  publicEnv ??= validatePublicEnv();
  return publicEnv;
}
