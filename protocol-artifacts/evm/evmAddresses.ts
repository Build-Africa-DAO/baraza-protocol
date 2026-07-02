/**
 * Deployed EVM contract addresses per chain ID.
 *
 * Source: contracts/evm/addresses/<chainId>.json
 * These are the Baraza governance contracts (Token, Auction, Governor, Treasury,
 * Manager) deployed via the Foundry scripts in contracts/evm/script/.
 *
 * Chain IDs:
 *   1         Ethereum mainnet
 *   10        Optimism
 *   137       Polygon
 *   42161     Arbitrum One
 *   42220     Celo
 *   8453      Base
 *   84532     Base Sepolia (testnet)
 *   11155111  Sepolia (Ethereum testnet)
 *   11155420  OP Sepolia
 *   7777777   Zora
 *   999999999 Zora Sepolia
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

const ADDRESSES: Record<number, EvmAddresses> = {
  // Ethereum mainnet
  1: {
    Manager: '0x0ca90a96ac58f19b1f69f67103245c9263bc4bfc',
    ManagerImpl: '0xABdEdc8730410716DD0a5E54A89C85546A3458bA',
    Token: '0x44D9FD02e6d8d96ca9c2bBD26C232024977674C5',
    Auction: '0xca8F9A4805CCFfdCcfc5Bf7973302a0c01f4347b',
    Governor: '0xaa21AFD73e6Fd5f69C87A6839D0beEDEE075e9a3',
    Treasury: '0x5daabe9382158c3f133b360a5f0b46ca5a7f6e86',
    MetadataRenderer: '0xec23ce6407ef841adf52e7232d3df5a44cb38041',
    ProtocolRewards: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B',
    ERC721RedeemMinter: '0xaefd4a9ea072abb12f043f5b2b2d845b7600c503',
    BarazaRewardsRecipient: '0x7498e6e471f31e869f038D8DBffbDFdf650c3F95',
    ManagerOwner: '0x7498e6e471f31e869f038D8DBffbDFdf650c3F95',
    WETH: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
  },

  // Optimism
  10: {
    Manager: '0x0ca90a96ac58f19b1f69f67103245c9263bc4bfc',
    ManagerImpl: '0xABdEdc8730410716DD0a5E54A89C85546A3458bA',
    Token: '0x44D9FD02e6d8d96ca9c2bBD26C232024977674C5',
    Auction: '0xca8F9A4805CCFfdCcfc5Bf7973302a0c01f4347b',
    Governor: '0xaa21AFD73e6Fd5f69C87A6839D0beEDEE075e9a3',
    Treasury: '0x5daabe9382158c3f133b360a5f0b46ca5a7f6e86',
    MetadataRenderer: '0xec23ce6407ef841adf52e7232d3df5a44cb38041',
    ProtocolRewards: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B',
    ERC721RedeemMinter: '0x5e7d2F1a7e9B2E92A3B8aC3Ad4d8D8C3ABcDe124',
  },

  // Base
  8453: {
    Manager: '0x0ca90a96ac58f19b1f69f67103245c9263bc4bfc',
    ManagerImpl: '0xABdEdc8730410716DD0a5E54A89C85546A3458bA',
    Token: '0x44D9FD02e6d8d96ca9c2bBD26C232024977674C5',
    Auction: '0xca8F9A4805CCFfdCcfc5Bf7973302a0c01f4347b',
    Governor: '0xaa21AFD73e6Fd5f69C87A6839D0beEDEE075e9a3',
    Treasury: '0x5daabe9382158c3f133b360a5f0b46ca5a7f6e86',
    MetadataRenderer: '0xec23ce6407ef841adf52e7232d3df5a44cb38041',
    ProtocolRewards: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B',
    ERC721RedeemMinter: '0xaefd4a9ea072abb12f043f5b2b2d845b7600c503',
  },

  // Base Sepolia (testnet)
  84532: {
    Manager: '0x0ca90a96ac58f19b1f69f67103245c9263bc4bfc',
    ManagerImpl: '0xABdEdc8730410716DD0a5E54A89C85546A3458bA',
    Token: '0x44D9FD02e6d8d96ca9c2bBD26C232024977674C5',
    Auction: '0xca8F9A4805CCFfdCcfc5Bf7973302a0c01f4347b',
    Governor: '0xaa21AFD73e6Fd5f69C87A6839D0beEDEE075e9a3',
    Treasury: '0x5daabe9382158c3f133b360a5f0b46ca5a7f6e86',
    MetadataRenderer: '0xec23ce6407ef841adf52e7232d3df5a44cb38041',
    ProtocolRewards: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B',
    ERC721RedeemMinter: '0xaefd4a9ea072abb12f043f5b2b2d845b7600c503',
  },

  // Sepolia (Ethereum testnet)
  11155111: {
    Manager: '0x0ca90a96ac58f19b1f69f67103245c9263bc4bfc',
    ManagerImpl: '0xABdEdc8730410716DD0a5E54A89C85546A3458bA',
    Token: '0x44D9FD02e6d8d96ca9c2bBD26C232024977674C5',
    Auction: '0xca8F9A4805CCFfdCcfc5Bf7973302a0c01f4347b',
    Governor: '0xaa21AFD73e6Fd5f69C87A6839D0beEDEE075e9a3',
    Treasury: '0x5daabe9382158c3f133b360a5f0b46ca5a7f6e86',
    MetadataRenderer: '0xec23ce6407ef841adf52e7232d3df5a44cb38041',
    ProtocolRewards: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B',
    ERC721RedeemMinter: '0xaefd4a9ea072abb12f043f5b2b2d845b7600c503',
    BarazaRewardsRecipient: '0x7498e6e471f31e869f038D8DBffbDFdf650c3F95',
    ManagerOwner: '0x7498e6e471f31e869f038D8DBffbDFdf650c3F95',
    WETH: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
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
