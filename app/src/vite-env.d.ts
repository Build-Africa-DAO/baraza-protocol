/// <reference types="vite/client" />

interface ImportMetaEnv {
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
  readonly VITE_WALLETCONNECT_PROJECT_ID: string | undefined;
  readonly VITE_ADMIN_WALLETS: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
