import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BADGE_DISTRIBUTION_GATE_REASONS,
  canBroadcastBadgeContent,
  canBroadcastBadgeContentFromEnv,
} from '@/lib/badgeDistribution';

describe('canBroadcastBadgeContent — pure gate', () => {
  it('blocks when USSD welcome is not deployed', () => {
    const r = canBroadcastBadgeContent({ ussdWelcomeDeployed: false });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(BADGE_DISTRIBUTION_GATE_REASONS.USSD_NOT_DEPLOYED);
  });

  it('allows when USSD welcome is deployed', () => {
    const r = canBroadcastBadgeContent({ ussdWelcomeDeployed: true });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('');
  });

  it('honors operator override even when USSD welcome undeployed', () => {
    const r = canBroadcastBadgeContent({
      ussdWelcomeDeployed: false,
      explicitOverride: true,
    });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe(BADGE_DISTRIBUTION_GATE_REASONS.OVERRIDE_LOGGED);
  });
});

describe('canBroadcastBadgeContentFromEnv — env-fed wrapper', () => {
  const ORIGINAL = { ...process.env };
  beforeEach(() => {
    delete process.env.USSD_WELCOME_DEPLOYED;
    delete process.env.BADGE_BROADCAST_OPERATOR_OVERRIDE;
  });
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it('falls closed when env is absent', () => {
    const r = canBroadcastBadgeContentFromEnv();
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(BADGE_DISTRIBUTION_GATE_REASONS.USSD_NOT_DEPLOYED);
  });

  it('opens when USSD_WELCOME_DEPLOYED=1', () => {
    process.env.USSD_WELCOME_DEPLOYED = '1';
    expect(canBroadcastBadgeContentFromEnv().allowed).toBe(true);
  });

  it('opens via operator override even without deployment signal', () => {
    process.env.BADGE_BROADCAST_OPERATOR_OVERRIDE = '1';
    const r = canBroadcastBadgeContentFromEnv();
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe(BADGE_DISTRIBUTION_GATE_REASONS.OVERRIDE_LOGGED);
  });
});
