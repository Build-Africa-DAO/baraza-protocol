import { describe, expect, it } from 'vitest';
import {
  createBountyRecord,
  getBountiesForCommunity,
  listBounties,
  listBountySubmissions,
  submitBountyWork,
} from '@/lib/bounties';

describe('bounties', () => {
  it('lists seeded bounties', () => {
    expect(listBounties().length).toBeGreaterThan(0);
    expect(getBountiesForCommunity('1').length).toBeGreaterThan(0);
  });

  it('creates a local bounty record', () => {
    const bounty = createBountyRecord({
      communityId: '1',
      postedBy: 'Kibera Youth Collective',
      title: 'Build member directory',
      category: 'Dev',
      rewardKes: 35000,
      deadline: '2026-07-01',
      summary: 'Create a searchable member directory.',
      skills: ['React', 'Search', 'UX'],
    });

    expect(bounty.status).toBe('open');
    expect(bounty.submissions).toBe(0);
    expect(getBountiesForCommunity('1').some((item) => item.id === bounty.id)).toBe(true);
  });

  it('records work submissions and increments displayed submission count', () => {
    const bounty = createBountyRecord({
      communityId: '2',
      postedBy: 'Mama Mboga Association',
      title: 'Produce catalog',
      category: 'Content',
      rewardKes: 20000,
      deadline: '2026-07-02',
      summary: 'Build a product catalog.',
      skills: ['Photography'],
    });

    const submission = submitBountyWork({
      bountyId: bounty.id,
      contributor: 'Amina',
      workUrl: 'https://example.com/work',
      note: 'Draft is ready.',
    });

    expect(submission.bountyId).toBe(bounty.id);
    expect(listBountySubmissions(bounty.id)).toHaveLength(1);
    expect(listBounties().find((item) => item.id === bounty.id)?.submissions).toBe(1);
  });

  it('rejects invalid bounty and submission data', () => {
    expect(() => createBountyRecord({
      communityId: '',
      postedBy: '',
      title: '',
      category: '',
      rewardKes: 0,
      deadline: '',
      summary: '',
      skills: [],
    })).toThrow(/community/i);

    expect(() => submitBountyWork({
      bountyId: 'b-1',
      contributor: '',
      workUrl: '',
      note: '',
    })).toThrow(/contributor/i);
  });
});
