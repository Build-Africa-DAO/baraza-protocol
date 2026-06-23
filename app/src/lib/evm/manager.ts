/**
 * Baraza DAO factory client for Base chain.
 *
 * Wraps the on-chain Manager contract (already deployed by the EVM governance
 * infrastructure provider on Base mainnet and Base Sepolia).
 *
 * Base mainnet  (chain 8453):  0x3ac0e64fe2931f8e082c6bb29283540de9b5371c
 * Base Sepolia  (chain 84532): 0x550c326d688fd51ae65ac6a2d48749e631023a03
 *
 * Override either via VITE_BASE_MANAGER_ADDRESS for custom deployments.
 */

import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { MANAGER_ABI } from '@/lib/evm/abis';

// ─── Known deployed Manager addresses ────────────────────────────────────────

const MANAGER_ADDRESSES: Record<number, `0x${string}`> = {
  8453:  '0x3ac0e64fe2931f8e082c6bb29283540de9b5371c', // Base mainnet
  84532: '0x550c326d688fd51ae65ac6a2d48749e631023a03', // Base Sepolia
};

export function managerAddress(): `0x${string}` {
  const override = import.meta.env.VITE_BASE_MANAGER_ADDRESS?.trim();
  if (override) return override as `0x${string}`;
  const isTestnet = import.meta.env.VITE_BASE_TESTNET === 'true';
  return MANAGER_ADDRESSES[isTestnet ? 84532 : 8453];
}

// ─── viem clients ────────────────────────────────────────────────────────────

function publicClient() {
  const rpcUrl = import.meta.env.VITE_BASE_RPC_URL?.trim();
  const isTestnet = import.meta.env.VITE_BASE_TESTNET === 'true';
  return createPublicClient({ chain: isTestnet ? baseSepolia : base, transport: http(rpcUrl || undefined) });
}

function walletClient() {
  if (typeof window === 'undefined' || !('ethereum' in window)) return null;
  const isTestnet = import.meta.env.VITE_BASE_TESTNET === 'true';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createWalletClient({ chain: isTestnet ? baseSepolia : base, transport: custom((window as any).ethereum) });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeployDaoParams {
  /** Wallet address of the DAO founder. Receives 0% ownership — NFT supply comes from auctions. */
  founderAddress: `0x${string}`;
  /** Token name, symbol, and description encoded as `abi.encode(name, symbol, desc, imageUri, rendererBase)`. */
  tokenInitStrings: `0x${string}`;
  /** Voting delay in seconds (default: ~1 day at 2s blocks on Base). */
  votingDelay?: number;
  /** Voting period in seconds (default: ~5 days). */
  votingPeriod?: number;
  /** Proposal threshold in basis points of total token supply (default: 100 = 1%). */
  proposalThresholdBps?: number;
  /** Quorum in basis points of total token supply (default: 400 = 4%). */
  quorumThresholdBps?: number;
  /** Timelock delay in seconds before a queued proposal can execute (default: 2 days). */
  timelockDelay?: number;
  /** Address allowed to veto proposals. Pass founderAddress for founder veto; address(0) for no veto. */
  vetoer?: `0x${string}`;
}

export interface DeployedDaoAddresses {
  token: `0x${string}`;
  metadataRenderer: `0x${string}`;
  auction: `0x${string}`;
  treasury: `0x${string}`;
  governor: `0x${string}`;
}

// ─── Read helper ─────────────────────────────────────────────────────────────

/** Returns the governor, treasury, auction, and metadata addresses for an existing DAO token. */
export async function getDaoAddresses(tokenAddress: `0x${string}`): Promise<DeployedDaoAddresses | null> {
  try {
    const client = publicClient();
    const result = await client.readContract({
      address: managerAddress(),
      abi: MANAGER_ABI,
      functionName: 'getAddresses',
      args: [tokenAddress],
    });
    const [metadataRenderer, auction, treasury, governor] = result as [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`];
    return { token: tokenAddress, metadataRenderer, auction, treasury, governor };
  } catch {
    return null;
  }
}

// ─── Write helper ─────────────────────────────────────────────────────────────

/**
 * Deploys a new Baraza DAO on Base chain via the Manager factory.
 *
 * The caller's connected wallet must have ETH to pay gas.
 * Returns the five contract addresses for the new DAO on success.
 */
export async function deployDao(params: DeployDaoParams): Promise<DeployedDaoAddresses | null> {
  const wc = walletClient();
  if (!wc) return null;

  const [account] = await wc.getAddresses();
  if (!account) return null;

  const {
    founderAddress,
    tokenInitStrings,
    votingDelay = 86400,     // 1 day
    votingPeriod = 432000,   // 5 days
    proposalThresholdBps = 100,
    quorumThresholdBps = 400,
    timelockDelay = 172800,  // 2 days
    vetoer = founderAddress,
  } = params;

  const client = publicClient();
  const metadataImpl = await client.readContract({
    address: managerAddress(),
    abi: MANAGER_ABI,
    functionName: 'metadataImpl',
  });

  try {
    const { request, result } = await client.simulateContract({
      address: managerAddress(),
      abi: MANAGER_ABI,
      functionName: 'deploy',
      args: [
        [{ wallet: founderAddress, ownershipPct: 0n, vestExpiry: 0n }],
        { initStrings: tokenInitStrings, metadataRenderer: metadataImpl as `0x${string}`, reservedUntilTokenId: 0n },
        { reservePrice: 0n, duration: 0n, founderRewardRecipent: founderAddress, founderRewardBps: 0 },
        {
          timelockDelay: BigInt(timelockDelay),
          votingDelay: BigInt(votingDelay),
          votingPeriod: BigInt(votingPeriod),
          proposalThresholdBps: BigInt(proposalThresholdBps),
          quorumThresholdBps: BigInt(quorumThresholdBps),
          vetoer,
        },
      ],
      account,
    });

    const hash = await wc.writeContract(request);
    await client.waitForTransactionReceipt({ hash });

    // viem simulateContract returns the decoded return value from the simulated call.
    // deploy() returns (token, metadataRenderer, auction, treasury, governor).
    const [token, metadataRenderer, auction, treasury, governor] = result as [
      `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`
    ];
    return { token, metadataRenderer, auction, treasury, governor };
  } catch {
    return null;
  }
}
