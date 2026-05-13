import { Connection, clusterApiUrl } from '@solana/web3.js';
import { WALLET_ADAPTER_NETWORK } from '@/lib/network';

const RPC_ENDPOINTS = [
  ...new Set(
    [
      import.meta.env.VITE_RPC_ENDPOINT,
      clusterApiUrl(WALLET_ADAPTER_NETWORK),
    ].filter(Boolean) as string[]
  ),
];

let activeEndpointIndex = 0;

export function getPrimaryEndpoint(): string {
  return RPC_ENDPOINTS[activeEndpointIndex] ?? RPC_ENDPOINTS[0];
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
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const endpointIdx = (activeEndpointIndex + i) % RPC_ENDPOINTS.length;
    const conn = new Connection(RPC_ENDPOINTS[endpointIdx], {
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
