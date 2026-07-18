export type CapabilityStatus = 'available' | 'testnet' | 'gated' | 'planned';
export type DisclosureLevel = 'plain' | 'full';

export type PlatformCapabilityId =
  | 'stellar-payments'
  | 'solana-governance'
  | 'base-governance'
  | 'avalanche-governance'
  | 'hedera-governance'
  | 'bank-rails'
  | 'group-withdrawals'
  | 'transaction-fee-billing';

export interface PlatformCapability {
  id: PlatformCapabilityId;
  status: CapabilityStatus;
  enabled: boolean;
  plainName: string;
  plainDescription: string;
  technicalName: string;
  technicalDescription: string;
  blockers: readonly string[];
}

export const PLATFORM_CAPABILITIES = {
  'stellar-payments': {
    id: 'stellar-payments',
    status: 'testnet',
    enabled: true,
    plainName: 'Test group contributions',
    plainDescription: 'Test contributions can be verified in the sandbox. Real-money use is not available yet.',
    technicalName: 'Stellar testnet payments',
    technicalDescription: 'Stellar payment verification is testnet-only until production settlement and indexer checks pass.',
    blockers: ['Fund and verify the testnet group account', 'Replace the demo order promoter with real settlement confirmation'],
  },
  'solana-governance': {
    id: 'solana-governance',
    status: 'planned',
    enabled: false,
    plainName: 'Practice group decisions',
    plainDescription: 'This decision system is still being prepared and is not available to communities.',
    technicalName: 'Solana governance programs',
    technicalDescription: 'Programs exist in the repository but still require verified devnet deployment and smoke tests.',
    blockers: ['Deploy all required programs to devnet', 'Run the shared governance conformance suite'],
  },
  'base-governance': {
    id: 'base-governance',
    status: 'planned',
    enabled: false,
    plainName: 'Alternative decision setup',
    plainDescription: 'This setup is coming later and cannot currently be selected.',
    technicalName: 'Base Sepolia governance',
    technicalDescription: 'Base contracts and adapter parity require testnet deployment and conformance verification.',
    blockers: ['Deploy the full stack to Base Sepolia', 'Run the shared governance conformance suite'],
  },
  'avalanche-governance': {
    id: 'avalanche-governance',
    status: 'planned',
    enabled: false,
    plainName: 'Avalanche sandbox',
    plainDescription: 'This sandbox is planned but is not available yet.',
    technicalName: 'Avalanche Fuji governance',
    technicalDescription: 'No complete Avalanche adapter or deployed governance stack is present yet.',
    blockers: ['Implement the adapter through the canonical adapter entry point', 'Deploy and verify the Fuji stack'],
  },
  'hedera-governance': {
    id: 'hedera-governance',
    status: 'planned',
    enabled: false,
    plainName: 'Hedera sandbox',
    plainDescription: 'This sandbox is planned but is not available yet.',
    technicalName: 'Hedera testnet governance',
    technicalDescription: 'No complete Hedera adapter or deployed governance stack is present yet.',
    blockers: ['Implement the adapter through the canonical adapter entry point', 'Deploy and verify the Hedera testnet stack'],
  },
  'bank-rails': {
    id: 'bank-rails',
    status: 'gated',
    enabled: false,
    plainName: 'Bank payments',
    plainDescription: 'Bank payments are not available yet.',
    technicalName: 'Bank rail abstraction',
    technicalDescription: 'Bank collections, standing orders, transfers, and KYC activation remain disabled.',
    blockers: ['Complete the regulatory scan', 'Sign a partner agreement', 'Approve and log activation'],
  },
  'group-withdrawals': {
    id: 'group-withdrawals',
    status: 'gated',
    enabled: false,
    plainName: 'Group withdrawals',
    plainDescription: 'Members can review the setup, but group withdrawals are paused.',
    technicalName: 'Treasury withdrawals',
    technicalDescription: 'Withdrawal execution remains disabled until authority handoff and devnet execution tests pass.',
    blockers: ['Complete multisig authority handoff', 'Pass devnet withdrawal execution and replay tests'],
  },
  'transaction-fee-billing': {
    id: 'transaction-fee-billing',
    status: 'gated',
    enabled: false,
    plainName: 'Baraza service fee',
    plainDescription: 'No live Baraza money-movement fee is being charged.',
    technicalName: 'Transaction-fee billing',
    technicalDescription: 'Live billing is disabled pending legal, pricing, disclosure, and reconciliation approval.',
    blockers: ['Complete regulatory review', 'Approve pricing controls', 'Verify visible fee disclosure and reconciliation'],
  },
} as const satisfies Record<PlatformCapabilityId, PlatformCapability>;

export function getPlatformCapability(id: PlatformCapabilityId): PlatformCapability {
  return PLATFORM_CAPABILITIES[id];
}

export function explainPlatformCapability(id: PlatformCapabilityId, disclosure: DisclosureLevel): string {
  const capability = getPlatformCapability(id);
  const description = disclosure === 'full' ? capability.technicalDescription : capability.plainDescription;
  if (capability.enabled) return description;
  return `${description} Current status: ${capability.status}.`;
}

export function listSelectableCapabilities(): PlatformCapability[] {
  return Object.values(PLATFORM_CAPABILITIES).filter((capability) => capability.enabled);
}
