import { describe, expect, it } from 'vitest';
import { handleUssdInput } from '@/lib/ussd/menu';
import type { UssdSession } from '@/lib/ussd/session';

function makeSession(): UssdSession {
  return {
    sessionId: 's1',
    phoneNumber: '+254700000000',
    serviceCode: '*384*0#',
    countryCode: 'KE',
    menuStack: [],
    data: {},
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
}

function input(text: string, brzaBalance?: number) {
  return handleUssdInput({
    session: makeSession(),
    text,
    phoneNumber: '+254700000000',
    brzaBalance,
  });
}

describe('handleUssdInput balance menu (BRZA)', () => {
  it('shows the BRZA balance passed in', () => {
    const result = input('1', 7);
    expect(result.action).toBe('CON');
    expect(result.text).toContain('BRZA: 7');
  });

  it('defaults the BRZA balance to 0 when undefined', () => {
    const result = input('1');
    expect(result.text).toContain('BRZA: 0');
  });

  it('returns to the main menu on 0', () => {
    const result = input('1*0', 7);
    expect(result.action).toBe('CON');
    expect(result.text).toContain('Baraza');
    expect(result.text).toContain('1. My Balance');
  });

  it('ends with the BRZA balance detail on refresh', () => {
    const result = input('1*1', 12);
    expect(result.action).toBe('END');
    expect(result.text).toContain('Your BRZA: 12');
  });

  it('ends with BRZA 0 on refresh when no balance is supplied', () => {
    const result = input('1*1');
    expect(result.action).toBe('END');
    expect(result.text).toContain('Your BRZA: 0');
  });
});

describe('handleUssdInput root routing', () => {
  it('returns the main menu for empty input', () => {
    const result = input('');
    expect(result.action).toBe('CON');
    expect(result.text).toContain('1. My Balance');
  });

  it('rejects an unknown root option', () => {
    const result = input('9');
    expect(result.action).toBe('END');
    expect(result.text).toContain('Invalid option');
  });
});
