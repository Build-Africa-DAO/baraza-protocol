import { describe, expect, it } from 'vitest';

import {
  explainPlatformCapability,
  getPlatformCapability,
  listSelectableCapabilities,
  PLATFORM_CAPABILITIES,
} from '@/lib/capabilityManifest';

describe('capabilityManifest', () => {
  it('keeps production-sensitive capabilities disabled', () => {
    expect(getPlatformCapability('bank-rails').enabled).toBe(false);
    expect(getPlatformCapability('group-withdrawals').enabled).toBe(false);
    expect(getPlatformCapability('transaction-fee-billing').enabled).toBe(false);
  });

  it('does not make planned chains selectable', () => {
    expect(listSelectableCapabilities().map((capability) => capability.id)).toEqual(['stellar-payments']);
    expect(getPlatformCapability('avalanche-governance').status).toBe('planned');
    expect(getPlatformCapability('hedera-governance').status).toBe('planned');
  });

  it('gives Akili accurate plain-language status for gated features', () => {
    expect(explainPlatformCapability('bank-rails', 'plain')).toContain('not available yet');
    expect(explainPlatformCapability('bank-rails', 'plain')).toContain('Current status: gated');
    expect(explainPlatformCapability('group-withdrawals', 'plain')).toContain('paused');
  });

  it('provides technical disclosure without changing availability', () => {
    const explanation = explainPlatformCapability('transaction-fee-billing', 'full');
    expect(explanation).toContain('Live billing is disabled');
    expect(PLATFORM_CAPABILITIES['transaction-fee-billing'].enabled).toBe(false);
  });

  it('names activation blockers for every unavailable capability', () => {
    const unavailable = Object.values(PLATFORM_CAPABILITIES).filter((capability) => !capability.enabled);
    expect(unavailable.every((capability) => capability.blockers.length > 0)).toBe(true);
  });
});
