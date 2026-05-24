import { describe, expect, it } from 'vitest';
import {
  DEWORK_BOUNTY_URL,
  buildDeworkBountyUrl,
  buildDeworkPostBountyUrl,
  listBounties,
} from '@/lib/bounties';

describe('bounties', () => {
  it('points every bounty to Dework', () => {
    expect(DEWORK_BOUNTY_URL).toBe('https://dework.xyz/');
    expect(listBounties()).not.toHaveLength(0);
    expect(listBounties().every((bounty) => bounty.externalUrl.startsWith(DEWORK_BOUNTY_URL))).toBe(true);
  });

  it('adds Baraza context to generated Dework links', () => {
    const bounty = listBounties()[0];
    const url = new URL(buildDeworkBountyUrl(bounty));
    expect(url.searchParams.get('source')).toBe('baraza');
    expect(url.searchParams.get('bounty')).toBe(bounty.id);
    expect(url.searchParams.get('q')).toBe(bounty.title);
  });

  it('builds a post-bounty workspace link', () => {
    const url = new URL(buildDeworkPostBountyUrl('Kibera Youth Collective'));
    expect(url.searchParams.get('source')).toBe('baraza');
    expect(url.searchParams.get('intent')).toBe('post-bounty');
    expect(url.searchParams.get('community')).toBe('Kibera Youth Collective');
  });
});
