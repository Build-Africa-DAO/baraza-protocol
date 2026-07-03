import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetWelcomeRegistryForTests,
  consumePendingWelcome,
  getStalePendingWelcomes,
  markMemberOnboarded,
  peekPendingWelcome,
  takePendingSmsFallbacks,
  welcomeFlow,
  type PendingWelcome,
} from '@/lib/ussd/welcome';
import { handleUssdInput } from '@/lib/ussd/menu';
import type { UssdSession } from '@/lib/ussd/session';
import { formatWelcomeSmsFallback } from '@/lib/notifications/sms';

const PHONE = '+254712345678';
const COMMUNITY_NAME = 'Kibera Youth Collective';

function seed(overrides: Partial<Omit<PendingWelcome, 'triggeredAt'>> = {}): void {
  markMemberOnboarded({
    phoneNumber: PHONE,
    communityCode: 'KYC',
    communityName: COMMUNITY_NAME,
    memberName: 'Wanjiku',
    paymentAmountKes: 100,
    monthsPaid: 1,
    totalMonthsExpected: 1,
    ...overrides,
  });
}

function makeSession(): UssdSession {
  return {
    sessionId: 's1',
    phoneNumber: PHONE,
    serviceCode: '*384#',
    countryCode: 'KE',
    menuStack: [],
    data: {},
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
}

beforeEach(() => {
  __resetWelcomeRegistryForTests();
});

afterEach(() => {
  __resetWelcomeRegistryForTests();
});

describe('welcome registry', () => {
  it('mark + peek + consume round-trip', () => {
    expect(peekPendingWelcome(PHONE)).toBeNull();
    seed();
    expect(peekPendingWelcome(PHONE)?.communityName).toBe(COMMUNITY_NAME);
    consumePendingWelcome(PHONE);
    expect(peekPendingWelcome(PHONE)).toBeNull();
  });

  it('getStalePendingWelcomes returns entries older than ms', () => {
    seed();
    expect(getStalePendingWelcomes(60_000)).toHaveLength(0);
    expect(getStalePendingWelcomes(0)).toHaveLength(1);
  });
});

describe('welcomeFlow — W0 belonging signal', () => {
  beforeEach(() => seed());

  it('renders W0 on empty input with member name + community + payment', () => {
    const r = welcomeFlow('', peekPendingWelcome(PHONE)!);
    expect(r.action).toBe('CON');
    expect(r.text).toContain('Karibu, Wanjiku');
    expect(r.text).toContain(COMMUNITY_NAME);
    expect(r.text).toContain('100 KES');
    expect(r.text).toContain('1. See what this means');
    expect(r.text).toContain('2. Main menu');
  });

  it('falls back to masked phone tail when no name is set', () => {
    consumePendingWelcome(PHONE);
    seed({ memberName: undefined });
    const r = welcomeFlow('', peekPendingWelcome(PHONE)!);
    expect(r.text).toContain('friend (5678)');
  });
});

describe('welcomeFlow — W1 voting primer', () => {
  beforeEach(() => seed({ activeProposalTitle: 'Emergency Fund Vote' }));

  it('advances to W1 with the active proposal title', () => {
    const r = welcomeFlow('1', peekPendingWelcome(PHONE)!);
    expect(r.action).toBe('CON');
    expect(r.text).toContain('Your voice counts here');
    expect(r.text).toContain('Emergency Fund Vote');
  });

  it('uses default example when no proposal is set', () => {
    consumePendingWelcome(PHONE);
    seed();
    const r = welcomeFlow('1', peekPendingWelcome(PHONE)!);
    expect(r.text).toContain('Purchase Shared Boda-Boda');
  });
});

describe('welcomeFlow — W2 standing preview', () => {
  it('shows standing with month progress', () => {
    seed({ monthsPaid: 1, totalMonthsExpected: 12 });
    const r = welcomeFlow('1*1', peekPendingWelcome(PHONE)!);
    expect(r.action).toBe('CON');
    expect(r.text).toContain('Month 1 done');
    expect(r.text).toContain('standing begins today');
    expect(r.text).toContain('Your record: 1/12');
  });
});

describe('welcomeFlow — W3 identity hint', () => {
  it('shows wallet-link hint', () => {
    seed();
    const r = welcomeFlow('1*1*1', peekPendingWelcome(PHONE)!);
    expect(r.action).toBe('CON');
    expect(r.text).toContain('link a wallet');
    expect(r.text).toContain('phone IS your membership');
    expect(r.text).toContain('1. Go to my community');
  });
});

describe('welcomeFlow — completion + skip', () => {
  it('consumes welcome on W3 "Go to my community" choice', () => {
    seed();
    const r = welcomeFlow('1*1*1*1', peekPendingWelcome(PHONE)!);
    expect(r.action).toBe('END');
    expect(r.text).toContain('Welcome complete');
    expect(r.text).toContain(COMMUNITY_NAME);
    expect(peekPendingWelcome(PHONE)).toBeNull();
  });

  it('consumes + queues SMS fallback when member picks "Main menu" on W0', () => {
    seed();
    const r = welcomeFlow('2', peekPendingWelcome(PHONE)!);
    expect(r.action).toBe('END');
    expect(r.text).toContain('Dial *384#');
    expect(peekPendingWelcome(PHONE)).toBeNull();
    expect(takePendingSmsFallbacks()).toEqual([PHONE]);
  });

  it('consumes without SMS fallback when member picks "Main menu" on later screens', () => {
    seed();
    welcomeFlow('1', peekPendingWelcome(PHONE)!); // W1
    const r = welcomeFlow('1*0', peekPendingWelcome(PHONE)!);
    expect(r.action).toBe('END');
    expect(peekPendingWelcome(PHONE)).toBeNull();
    expect(takePendingSmsFallbacks()).toEqual([]);
  });

  it('rejects invalid selections at each step', () => {
    seed();
    expect(welcomeFlow('9', peekPendingWelcome(PHONE)!).text).toContain('Invalid');
    expect(welcomeFlow('1*9', peekPendingWelcome(PHONE)!).text).toContain('Invalid');
  });
});

describe('handleUssdInput integration', () => {
  it('routes through welcome when phone has a pending welcome', () => {
    seed();
    const r = handleUssdInput({ session: makeSession(), text: '', phoneNumber: PHONE });
    expect(r.text).toContain('Karibu');
  });

  it('routes through main menu when no pending welcome', () => {
    const r = handleUssdInput({ session: makeSession(), text: '', phoneNumber: PHONE });
    expect(r.text).toContain('1. My Balance');
  });

  it('returns to main menu after welcome consumes', () => {
    seed();
    handleUssdInput({ session: makeSession(), text: '1*1*1*1', phoneNumber: PHONE });
    const r = handleUssdInput({ session: makeSession(), text: '', phoneNumber: PHONE });
    expect(r.text).toContain('1. My Balance');
  });
});

describe('formatWelcomeSmsFallback', () => {
  it('produces plain ASCII fallback referencing the community', () => {
    const sms = formatWelcomeSmsFallback(COMMUNITY_NAME);
    expect(sms).toContain('Welcome to Kibera Youth Collective');
    expect(sms).toContain('Dial *384#');
    expect(sms).toContain('membership starts now');
  });
});
