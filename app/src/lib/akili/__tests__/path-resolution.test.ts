import { describe, expect, it } from 'vitest';
import * as fromLib from '@/lib/akili';
import * as fromCanonical from '@/akili';
import { COUNCIL_AGENTS as libCouncil } from '@/lib/akili/council';
import { COUNCIL_AGENTS as canCouncil } from '@/akili/council';
import { AKILI_RELAY as libRelay } from '@/lib/akili/prompts';
import { AKILI_RELAY as canRelay } from '@/akili/prompts';

describe('akili path resolution (#16)', () => {
  it('resolves @/lib/akili and @/akili to the same council registry', () => {
    expect(Object.keys(libCouncil).sort()).toEqual(Object.keys(canCouncil).sort());
    expect(fromLib.COUNCIL_AGENTS).toBeDefined();
    expect(fromCanonical.COUNCIL_AGENTS).toBeDefined();
  });

  it('resolves prompts via both import paths', () => {
    expect(libRelay).toEqual(canRelay);
  });
});
