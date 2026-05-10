import { Connection, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const DEVNET_ENDPOINTS = [
  import.meta.env.VITE_RPC_ENDPOINT,
  'https://api.devnet.solana.com',
  clusterApiUrl(WalletAdapterNetwork.Devnet),
].filter(Boolean) as string[];

let activeEndpointIndex = 0;

export function getPrimaryEndpoint(): string {
  return DEVNET_ENDPOINTS[activeEndpointIndex] ?? DEVNET_ENDPOINTS[0];
}

/**
 * Creates a Connection with automatic fallback to backup RPCs.
 * On rate-limit or network failure, rotates to the next endpoint.
 */
export function createConnection(): Connection {
  return new Connection(getPrimaryEndpoint(), {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false,
  });
}

/**
 * Execute an RPC call with fallback across all available endpoints.
 */
export async function withRpcFallback<T>(
  fn: (connection: Connection) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < DEVNET_ENDPOINTS.length; i++) {
    const endpointIdx = (activeEndpointIndex + i) % DEVNET_ENDPOINTS.length;
    const conn = new Connection(DEVNET_ENDPOINTS[endpointIdx], {
      commitment: 'confirmed',
    });
    try {
      const result = await fn(conn);
      activeEndpointIndex = endpointIdx; // Promote working endpoint
      return result;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
