import { describe, expect, it } from 'vitest';
import {
  createBountyRecord,
  approveSubmissionByRole,
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

  it('normalizes infrastructure wording in the deployment bounty', () => {
    window.localStorage.setItem('baraza.bounties.v1', JSON.stringify([{
      id: 'b-tb-onchain',
      communityId: '3',
      title: 'Baraza Token program deployment guide',
      category: 'Dev',
      rewardKes: 35000,
      deadline: '2026-06-20',
      submissions: 2,
      status: 'in_review',
      postedBy: 'TechBridge Nairobi',
      summary: 'Write a deployment guide.',
      skills: ['Baraza Token', 'Anchor'],
      access: 'community-restricted',
      rewardToken: 'SOL',
    }]));

    const bounty = listBounties().find((item) => item.id === 'b-tb-onchain');

    expect(bounty?.title).toBe('Community governance deployment guide');
    expect(bounty?.skills).toContain('Governance');
    expect(bounty?.skills).not.toContain('Solana');
  });

  it('creates a local bounty record', () => {
    const bounty = createBountyRecord({
      communityId: '1',
      postedBy: 'Kibera Youth Collective',
      approvalProposalId: 'proposal-1',
      title: 'Build member directory',
      category: 'Dev',
      rewardKes: 35000,
      deadline: '2026-07-01',
      summary: 'Create a searchable member directory.',
      skills: ['React', 'Search', 'UX'],
    });

    expect(bounty.status).toBe('open');
    expect(bounty.submissions).toBe(0);
    expect(bounty.approvalProposalId).toBe('proposal-1');
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

  it('requires creator and admin approval before marking work approved', () => {
    const bounty = createBountyRecord({
      communityId: '2',
      postedBy: 'Mama Mboga Association',
      createdBy: 'creator-1',
      title: 'Review market prices',
      category: 'Research',
      rewardKes: 12000,
      deadline: '2026-07-12',
      summary: 'Verify weekly produce prices.',
      skills: ['Research'],
    });
    const submission = submitBountyWork({
      bountyId: bounty.id,
      contributor: 'Amina',
      workUrl: 'https://example.com/prices',
      note: 'Ready for review.',
    });

    const adminOnly = approveSubmissionByRole(submission.id, 'admin', 'admin-1');
    expect(adminOnly?.status).toBe('pending');
    expect(adminOnly?.adminApprovedAt).toBeTruthy();
    expect(adminOnly?.creatorApprovedAt).toBeUndefined();

    const fullyApproved = approveSubmissionByRole(submission.id, 'creator', 'creator-1');
    expect(fullyApproved?.status).toBe('approved');
    expect(fullyApproved?.creatorApprovedAt).toBeTruthy();
    expect(fullyApproved?.adminApprovedAt).toBeTruthy();
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
