import { z } from 'zod';

const urlField = z
  .string()
  .trim()
  .url()
  .transform((value) => value.replace(/\/$/, ''));

const envSchema = z.object({
  VITE_SITE_URL: urlField.catch('https://baraza-protocol.vercel.app'),
  VITE_SOLANA_NETWORK: z.enum(['devnet', 'testnet', 'mainnet', 'mainnet-beta']).default('devnet'),
  VITE_RPC_ENDPOINT: urlField.catch('https://api.devnet.solana.com'),
  VITE_STELLAR_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  VITE_STELLAR_HORIZON_URL: urlField.catch('https://horizon-testnet.stellar.org'),
  VITE_STELLAR_NETWORK_PASSPHRASE: z.string().trim().min(1).catch('Test SDF Network ; September 2015'),
  VITE_WALLETCONNECT_PROJECT_ID: z.string().trim().optional(),
  VITE_SUPABASE_URL: z.string().trim().url().optional().or(z.literal('')),
  VITE_SUPABASE_ANON_KEY: z.string().trim().optional(),
});

export type PublicEnv = z.infer<typeof envSchema>;

export function validatePublicEnv(): PublicEnv {
  const result = envSchema.safeParse(import.meta.env);
  if (result.success) {
    const warnings: string[] = [];
    if (!result.data.VITE_WALLETCONNECT_PROJECT_ID) {
      warnings.push('VITE_WALLETCONNECT_PROJECT_ID is not set; mobile wallet deep-link support may be limited.');
    }
    if (!result.data.VITE_SUPABASE_URL || !result.data.VITE_SUPABASE_ANON_KEY) {
      warnings.push('Supabase public env is not set; deployed data persistence will fall back to local/mock data.');
    }
    warnings.forEach((warning) => console.warn(`[baraza env] ${warning}`));
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Baraza testnet env is incomplete:\n${details}`);
}
