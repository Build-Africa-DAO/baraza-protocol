import { describe, expect, it } from 'vitest';
import { DEWORK_BOUNTY_URL, listBounties } from '@/lib/bounties';

describe('bounties', () => {
  it('points every bounty to Dework', () => {
    expect(DEWORK_BOUNTY_URL).toBe('https://dework.xyz/');
    expect(listBounties()).not.toHaveLength(0);
    expect(listBounties().every((bounty) => bounty.externalUrl === DEWORK_BOUNTY_URL)).toBe(true);
  });
});
