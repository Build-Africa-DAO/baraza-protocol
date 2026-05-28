/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string | undefined;
  readonly VITE_RPC_ENDPOINT: string | undefined;
  readonly VITE_PROGRAM_ID: string | undefined;
  readonly VITE_COMMUNITY_REGISTRY_PROGRAM_ID: string | undefined;
  readonly VITE_GOVERNANCE_PROGRAM_ID: string | undefined;
  readonly VITE_MEMBERSHIP_PROGRAM_ID: string | undefined;
  readonly VITE_PAYMENT_ATTESTATION_PROGRAM_ID: string | undefined;
  readonly VITE_TREASURY_VAULT_PROGRAM_ID: string | undefined;
  readonly VITE_SUPABASE_URL: string | undefined;
  readonly VITE_SUPABASE_ANON_KEY: string | undefined;
  readonly VITE_SOLANA_NETWORK: string | undefined;
  readonly VITE_STELLAR_NETWORK: string | undefined;
  readonly VITE_STELLAR_HORIZON_URL: string | undefined;
  readonly VITE_STELLAR_NETWORK_PASSPHRASE: string | undefined;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string | undefined;
  readonly VITE_ADMIN_WALLETS: string | undefined;
  readonly VITE_BASE_RPC_URL: string | undefined;
  readonly VITE_ETH_RPC_URL: string | undefined;
  readonly VITE_ARBITRUM_RPC_URL: string | undefined;
  readonly VITE_OPTIMISM_RPC_URL: string | undefined;
  readonly VITE_CELO_RPC_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
