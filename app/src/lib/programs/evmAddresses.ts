/**
 * Deployed EVM contract addresses per chain ID.
 *
 * Source: contracts/evm/addresses/<chainId>.json
 * These are Baraza's own governance contracts (Token, Auction, Governor, Treasury,
 * Manager), deployed via the Foundry scripts in contracts/evm/script/.
 *
 * NOT_DEPLOYED below means Baraza has not deployed its own contracts on that
 * chain yet — do not fill these in with any other protocol's addresses.
 * When a real Baraza deployment lands, replace the placeholder for that chain
 * with the actual deployed address from contracts/evm/addresses/<chainId>.json.
 *
 * Chain IDs currently tracked here:
 *   1         Ethereum mainnet
 *   10        Optimism
 *   8453      Base
 *   84532     Base Sepolia (testnet)
 *   11155111  Sepolia (Ethereum testnet)
 */

export interface EvmAddresses {
  Manager: string;
  ManagerImpl: string;
  Token: string;
  Auction: string;
  Governor: string;
  Treasury: string;
  MetadataRenderer: string;
  ProtocolRewards: string;
  ERC721RedeemMinter?: string;
  BarazaRewardsRecipient?: string;
  ManagerOwner?: string;
  WETH?: string;
}

const NOT_DEPLOYED = '0x0000000000000000000000000000000000000000';

const ADDRESSES: Record<number, EvmAddresses> = {
  // Ethereum mainnet — not yet deployed
  1: {
    Manager: NOT_DEPLOYED,
    ManagerImpl: NOT_DEPLOYED,
    Token: NOT_DEPLOYED,
    Auction: NOT_DEPLOYED,
    Governor: NOT_DEPLOYED,
    Treasury: NOT_DEPLOYED,
    MetadataRenderer: NOT_DEPLOYED,
    ProtocolRewards: NOT_DEPLOYED,
  },

  // Optimism — not yet deployed
  10: {
    Manager: NOT_DEPLOYED,
    ManagerImpl: NOT_DEPLOYED,
    Token: NOT_DEPLOYED,
    Auction: NOT_DEPLOYED,
    Governor: NOT_DEPLOYED,
    Treasury: NOT_DEPLOYED,
    MetadataRenderer: NOT_DEPLOYED,
    ProtocolRewards: NOT_DEPLOYED,
  },

  // Base — not yet deployed
  8453: {
    Manager: NOT_DEPLOYED,
    ManagerImpl: NOT_DEPLOYED,
    Token: NOT_DEPLOYED,
    Auction: NOT_DEPLOYED,
    Governor: NOT_DEPLOYED,
    Treasury: NOT_DEPLOYED,
    MetadataRenderer: NOT_DEPLOYED,
    ProtocolRewards: NOT_DEPLOYED,
  },

  // Base Sepolia (testnet) — not yet deployed
  84532: {
    Manager: NOT_DEPLOYED,
    ManagerImpl: NOT_DEPLOYED,
    Token: NOT_DEPLOYED,
    Auction: NOT_DEPLOYED,
    Governor: NOT_DEPLOYED,
    Treasury: NOT_DEPLOYED,
    MetadataRenderer: NOT_DEPLOYED,
    ProtocolRewards: NOT_DEPLOYED,
  },

  // Sepolia (Ethereum testnet) — not yet deployed
  11155111: {
    Manager: NOT_DEPLOYED,
    ManagerImpl: NOT_DEPLOYED,
    Token: NOT_DEPLOYED,
    Auction: NOT_DEPLOYED,
    Governor: NOT_DEPLOYED,
    Treasury: NOT_DEPLOYED,
    MetadataRenderer: NOT_DEPLOYED,
    ProtocolRewards: NOT_DEPLOYED,
  },
};

/** Returns contract addresses for a given EVM chain ID, or null if unsupported. */
export function getEvmAddresses(chainId: number): EvmAddresses | null {
  return ADDRESSES[chainId] ?? null;
}

/** Chain IDs with deployed contracts. */
export const SUPPORTED_EVM_CHAIN_IDS = Object.keys(ADDRESSES).map(Number);

/** Map from Baraza chain name to the testnet chain ID used by the app. */
export const CHAIN_NAME_TO_ID: Record<string, number> = {
  ethereum: 11155111,
  optimism: 11155420,
  polygon: 80002,
  arbitrum: 421614,
  bnb: 97,
  celo: 44787,
  base: 84532,
};
