import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface CommunityTokenLaunchConfig {
  communityId: string;
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  umbrellaTreasuryPct: number;
  optionalLaunch: boolean;
}

export interface CommunityTokenLaunchPlan extends CommunityTokenLaunchConfig {
  tokenProgramId: string;
  testnet: 'solana-devnet';
  requiresSignature: true;
  mintAddress: string | null;
  status: 'draft' | 'ready-for-signature';
}

export function createCommunityTokenLaunchPlan(
  config: CommunityTokenLaunchConfig,
): CommunityTokenLaunchPlan {
  if (!config.communityId) throw new Error('Community is required.');
  if (!config.name.trim()) throw new Error('Token name is required.');
  if (!/^[A-Z0-9$]{2,12}$/.test(config.symbol.trim())) {
    throw new Error('Token symbol must be 2-12 uppercase characters.');
  }
  if (config.decimals < 0 || config.decimals > 9) {
    throw new Error('Solana token decimals must be between 0 and 9.');
  }
  if (config.umbrellaTreasuryPct < 0 || config.umbrellaTreasuryPct > 25) {
    throw new Error('Umbrella treasury split must be between 0% and 25%.');
  }

  return {
    ...config,
    symbol: config.symbol.trim(),
    tokenProgramId: TOKEN_PROGRAM_ID.toBase58(),
    testnet: 'solana-devnet',
    requiresSignature: true,
    mintAddress: null,
    status: 'ready-for-signature',
  };
}

export function shouldLaunchCommunityToken(config: Pick<CommunityTokenLaunchConfig, 'optionalLaunch'>): boolean {
  return config.optionalLaunch;
}
