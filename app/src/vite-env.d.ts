/// <reference types="vite/client" />

interface ImportMetaEnv {
  // App
  readonly VITE_SITE_URL: string | undefined;

  // Supabase (public)
  readonly VITE_SUPABASE_URL: string | undefined;
  readonly VITE_SUPABASE_ANON_KEY: string | undefined;

  // Stellar / BRZA
  readonly VITE_STELLAR_NETWORK: string | undefined;
  readonly VITE_STELLAR_HORIZON_URL: string | undefined;
  readonly VITE_STELLAR_NETWORK_PASSPHRASE: string | undefined;
  readonly VITE_STELLAR_TREASURY_ACCOUNT: string | undefined;
  readonly VITE_BRZA_ISSUER_ADDRESS: string | undefined;
  readonly VITE_BRZA_DISTRIBUTOR_ADDRESS: string | undefined;

  // Solana
  readonly VITE_SOLANA_NETWORK: string | undefined;
  readonly VITE_RPC_ENDPOINT: string | undefined;
  readonly VITE_PROGRAM_ID: string | undefined;
  readonly VITE_COMMUNITY_REGISTRY_PROGRAM_ID: string | undefined;
  readonly VITE_GOVERNANCE_PROGRAM_ID: string | undefined;
  readonly VITE_MEMBERSHIP_PROGRAM_ID: string | undefined;
  readonly VITE_PAYMENT_ATTESTATION_PROGRAM_ID: string | undefined;
  readonly VITE_TREASURY_VAULT_PROGRAM_ID: string | undefined;

  // Wallets
  readonly VITE_WALLETCONNECT_PROJECT_ID: string | undefined;
  readonly VITE_PRIVY_APP_ID: string | undefined;

  // EVM RPC endpoints
  readonly VITE_ETH_RPC_URL: string | undefined;
  readonly VITE_BASE_RPC_URL: string | undefined;
  readonly VITE_ARBITRUM_RPC_URL: string | undefined;
  readonly VITE_OPTIMISM_RPC_URL: string | undefined;
  readonly VITE_POLYGON_RPC_URL: string | undefined;
  readonly VITE_BNB_RPC_URL: string | undefined;
  readonly VITE_CELO_RPC_URL: string | undefined;
  readonly VITE_XDC_RPC_URL: string | undefined;

  // Base chain governance contracts
  // Manager is pre-deployed; VITE_BASE_MANAGER_ADDRESS only needed to override the default.
  readonly VITE_BASE_MANAGER_ADDRESS: string | undefined;
  readonly VITE_BASE_TESTNET: string | undefined;
  // Per-DAO contracts — set after Manager.deploy() for a specific community
  readonly VITE_BASE_GOVERNOR_ADDRESS: string | undefined;
  readonly VITE_BASE_TOKEN_ADDRESS: string | undefined;
  readonly VITE_BASE_TREASURY_ADDRESS: string | undefined;

  // EVM contract addresses
  readonly VITE_ETH_CONTRACT_ADDR: string | undefined;
  readonly VITE_BASE_CONTRACT_ADDR: string | undefined;
  readonly VITE_ARBITRUM_CONTRACT_ADDR: string | undefined;
  readonly VITE_OPTIMISM_CONTRACT_ADDR: string | undefined;
  readonly VITE_POLYGON_CONTRACT_ADDR: string | undefined;
  readonly VITE_BNB_CONTRACT_ADDR: string | undefined;
  readonly VITE_CELO_CONTRACT_ADDR: string | undefined;
  readonly VITE_XDC_CONTRACT_ADDR: string | undefined;

  // GoodDollar
  readonly VITE_GOODDOLLAR_ENABLED: string | undefined;
  readonly VITE_GOODDOLLAR_TOKEN_ADDRESS: string | undefined;
  readonly VITE_GOODDOLLAR_IDENTITY_ADDRESS: string | undefined;

  // Admin
  readonly VITE_ADMIN_WALLETS: string | undefined;
  readonly VITE_ADMIN_NFT_THRESHOLD: string | undefined;
  readonly VITE_ADMIN_NFT_COUNT: string | undefined;

  // Indexing
  readonly VITE_SUBGRAPH_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
