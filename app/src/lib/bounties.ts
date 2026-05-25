import { getSupabaseClient } from '@/lib/communities';

/** Full task lifecycle: open → in_progress → in_review → awarded → paid */
export type BountyStatus = 'open' | 'in_progress' | 'in_review' | 'awarded' | 'paid';

export interface Bounty {
  id: string;
  communityId: string;
  title: string;
  category: string;
  rewardKes: number;
  deadline: string;
  submissions: number;
  status: BountyStatus;
  postedBy: string;
  summary: string;
  skills: string[];
  /** Wallet address or display name of the assigned contributor, if any. */
  assignee?: string;
  /** Maximum number of applicants allowed (0 = unlimited). */
  maxApplicants?: number;
  /** If true, only verified community members may apply. */
  roleGated?: boolean;
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  contributor: string;
  workUrl: string;
  note: string;
  submittedAt: string;
  /** Approval state set by the admin after review. */
  status?: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
}

export interface CreateBountyInput {
  communityId: string;
  postedBy: string;
  title: string;
  category: string;
  rewardKes: number;
  deadline: string;
  summary: string;
  skills: string[];
  maxApplicants?: number;
  roleGated?: boolean;
}

const LOCAL_BOUNTIES_KEY = 'baraza.bounties.v1';
const LOCAL_SUBMISSIONS_KEY = 'baraza.bountySubmissions.v1';

interface BountyRow {
  id: string;
  community_id: string;
  title: string;
  category: string;
  reward_kes: number | string;
  deadline: string;
  status: BountyStatus;
  posted_by: string;
  summary: string;
  skills: string[] | null;
}

interface BountySubmissionRow {
  id: string;
  bounty_id: string;
  contributor: string;
  work_url: string;
  note: string | null;
  submitted_at: string;
  status?: string;
  reviewed_at?: string;
}

const SEED_BOUNTIES: Bounty[] = [
  {
    id: 'b-ky-brand',
    communityId: '1',
    title: 'Youth business poster kit',
    category: 'Design',
    rewardKes: 26000,
    deadline: '2026-06-08',
    submissions: 4,
    status: 'open',
    postedBy: 'Kibera Youth Collective',
    summary: 'Create reusable poster and WhatsApp story templates for member businesses.',
    skills: ['Canva', 'Branding', 'Social media'],
  },
  {
    id: 'b-ky-training',
    communityId: '1',
    title: 'Financial literacy facilitator',
    category: 'Events',
    rewardKes: 42000,
    deadline: '2026-06-14',
    submissions: 2,
    status: 'open',
    postedBy: 'Kibera Youth Collective',
    summary: 'Run a Saturday workshop on savings, pricing, and mobile-money records.',
    skills: ['Training', 'Events', 'Finance'],
  },
  {
    id: 'b-mm-supplier',
    communityId: '2',
    title: 'Supplier price tracker',
    category: 'Operations',
    rewardKes: 18000,
    deadline: '2026-06-05',
    submissions: 6,
    status: 'in_review',
    postedBy: 'Mama Mboga Association',
    summary: 'Collect weekly market prices and publish a simple member buying guide.',
    skills: ['Research', 'Sheets', 'Procurement'],
    assignee: 'Wanjiru M.',
    roleGated: true,
  },
  {
    id: 'b-mm-photo',
    communityId: '2',
    title: 'Vendor product photo day',
    category: 'Events',
    rewardKes: 30000,
    deadline: '2026-06-17',
    submissions: 1,
    status: 'open',
    postedBy: 'Mama Mboga Association',
    summary: 'Photograph 25 vendor stalls for online catalogues and delivery menus.',
    skills: ['Photography', 'Events', 'Content'],
  },
  {
    id: 'b-tb-audit',
    communityId: '3',
    title: 'Smart contract audit notes',
    category: 'Dev',
    rewardKes: 64500,
    deadline: '2026-06-10',
    submissions: 3,
    status: 'open',
    postedBy: 'TechBridge Nairobi',
    summary: 'Review governance contract assumptions and produce issue-ranked audit notes.',
    skills: ['Solana', 'Rust', 'Security'],
  },
  {
    id: 'b-tb-mentor',
    communityId: '3',
    title: 'Junior dev mentorship night',
    category: 'Events',
    rewardKes: 22000,
    deadline: '2026-06-12',
    submissions: 5,
    status: 'paid',
    postedBy: 'TechBridge Nairobi',
    summary: 'Host a practical pair-programming session for junior DAO members.',
    skills: ['Mentoring', 'React', 'Community'],
    assignee: 'David K.',
  },
  {
    id: 'b-tb-onchain',
    communityId: '3',
    title: 'Solana program deployment guide',
    category: 'Dev',
    rewardKes: 35000,
    deadline: '2026-06-20',
    submissions: 2,
    status: 'in_progress',
    postedBy: 'TechBridge Nairobi',
    summary: 'Write a step-by-step guide for deploying Anchor programs to devnet.',
    skills: ['Solana', 'Anchor', 'Technical writing'],
    assignee: 'Amara T.',
    roleGated: true,
  },
  {
    id: 'b-mh-site',
    communityId: '4',
    title: 'Site visit photo report',
    category: 'Field work',
    rewardKes: 38000,
    deadline: '2026-06-09',
    submissions: 2,
    status: 'open',
    postedBy: 'Mwanzo Housing Sacco',
    summary: 'Document Plot 3 access roads, utilities, and boundary markers for members.',
    skills: ['Photography', 'Reporting', 'Mapping'],
  },
  {
    id: 'b-mh-legal',
    communityId: '4',
    title: 'Land title checklist',
    category: 'Research',
    rewardKes: 55000,
    deadline: '2026-06-21',
    submissions: 0,
    status: 'open',
    postedBy: 'Mwanzo Housing Sacco',
    summary: 'Prepare a member-readable title due-diligence checklist before purchase votes.',
    skills: ['Legal ops', 'Research', 'Real estate'],
  },
  {
    id: 'b-kf-soil',
    communityId: '5',
    title: 'Soil analysis report — Kakamega',
    category: 'Research',
    rewardKes: 32000,
    deadline: '2026-06-18',
    submissions: 0,
    status: 'open',
    postedBy: 'Kakamega Farmers DAO',
    summary: 'Collect and summarise soil test results from 10 member plots to inform collective input purchases.',
    skills: ['Agronomy', 'Research', 'Reporting'],
  },
  {
    id: 'b-kf-stellar',
    communityId: '5',
    title: 'Stellar M-Pesa anchor integration guide',
    category: 'Dev',
    rewardKes: 72000,
    deadline: '2026-06-25',
    submissions: 1,
    status: 'open',
    postedBy: 'Kakamega Farmers DAO',
    summary: 'Document the SEP-24 flow for depositing KES via M-Pesa into the DAO treasury on Stellar testnet.',
    skills: ['Stellar', 'SEP-24', 'M-Pesa', 'Technical writing'],
  },
  {
    id: 'b-wt-swahili',
    communityId: '6',
    title: 'Governance docs — Swahili translation',
    category: 'Translation',
    rewardKes: 14000,
    deadline: '2026-06-15',
    submissions: 3,
    status: 'open',
    postedBy: 'Westlands Traders Circle',
    summary: 'Translate the DAO constitution and voting rules into Swahili for non-English-speaking members.',
    skills: ['Swahili', 'Translation', 'Legal ops'],
  },
  {
    id: 'b-wt-newsletter',
    communityId: '6',
    title: 'Monthly market update newsletter',
    category: 'Writing',
    rewardKes: 8500,
    deadline: '2026-06-12',
    submissions: 6,
    status: 'in_review',
    postedBy: 'Westlands Traders Circle',
    summary: 'Write a concise member newsletter covering import prices, exchange rates, and DAO treasury update.',
    skills: ['Writing', 'Finance', 'Editing'],
    assignee: 'Halima O.',
  },
  {
    id: 'b-ky-stellar-onboard',
    communityId: '1',
    title: 'Stellar wallet onboarding workshop',
    category: 'Events',
    rewardKes: 28000,
    deadline: '2026-06-28',
    submissions: 2,
    status: 'open',
    postedBy: 'Kibera Youth Collective',
    summary: 'Run a hands-on workshop teaching members how to set up a Stellar wallet and receive KES payouts.',
    skills: ['Stellar', 'Training', 'Community'],
  },
];

function readLocalBounties(): Bounty[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_BOUNTIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalBounties(bounties: Bounty[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_BOUNTIES_KEY, JSON.stringify(bounties));
}

function readSubmissions(): BountySubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubmissions(submissions: BountySubmission[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

function splitSkills(raw: string[]): string[] {
  return raw.map((skill) => skill.trim()).filter(Boolean).slice(0, 6);
}

function bountyFromRow(row: BountyRow, submissions = 0): Bounty {
  return {
    id: row.id,
    communityId: row.community_id,
    title: row.title,
    category: row.category,
    rewardKes: Number(row.reward_kes),
    deadline: row.deadline,
    submissions,
    status: row.status,
    postedBy: row.posted_by,
    summary: row.summary,
    skills: row.skills ?? [],
  };
}

function submissionFromRow(row: BountySubmissionRow): BountySubmission {
  return {
    id: row.id,
    bountyId: row.bounty_id,
    contributor: row.contributor,
    workUrl: row.work_url,
    note: row.note ?? '',
    submittedAt: row.submitted_at,
    status: (row.status as BountySubmission['status']) ?? 'pending',
    reviewedAt: row.reviewed_at,
  };
}

function sortBounties(bounties: Bounty[]): Bounty[] {
  return [...bounties].sort((a, b) => {
    const statusRank = Number(b.status === 'open') - Number(a.status === 'open');
    if (statusRank !== 0) return statusRank;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

export function listBounties(): Bounty[] {
  const submissions = readSubmissions();
  const local = readLocalBounties();
  // Local entries shadow seeds with the same id (status overrides, reassignments, etc.)
  const localIds = new Set(local.map((b) => b.id));
  const merged = [...SEED_BOUNTIES.filter((b) => !localIds.has(b.id)), ...local];
  return sortBounties(merged.map((bounty) => ({
    ...bounty,
    submissions: bounty.submissions + submissions.filter((s) => s.bountyId === bounty.id).length,
  })));
}

export async function listBountiesAsync(): Promise<Bounty[]> {
  const client = getSupabaseClient();
  if (!client) return listBounties();

  const [{ data: rows, error: bountyError }, { data: submissionRows, error: submissionError }] = await Promise.all([
    client
      .from('bounties')
      .select('id,community_id,title,category,reward_kes,deadline,status,posted_by,summary,skills'),
    client
      .from('bounty_submissions')
      .select('bounty_id'),
  ]);

  if (bountyError) throw bountyError;
  if (submissionError) throw submissionError;

  const counts = new Map<string, number>();
  (submissionRows ?? []).forEach((row: { bounty_id: string }) => {
    counts.set(row.bounty_id, (counts.get(row.bounty_id) ?? 0) + 1);
  });

  return sortBounties((rows ?? []).map((row) => bountyFromRow(row as BountyRow, counts.get(row.id) ?? 0)));
}

export function getBountiesForCommunity(communityId: string): Bounty[] {
  return listBounties().filter((bounty) => bounty.communityId === communityId);
}

export async function getBountiesForCommunityAsync(communityId: string): Promise<Bounty[]> {
  return (await listBountiesAsync()).filter((bounty) => bounty.communityId === communityId);
}

export function getOpenBountiesForCommunity(communityId: string): Bounty[] {
  return getBountiesForCommunity(communityId).filter((bounty) => bounty.status === 'open');
}

export function createBountyRecord(input: CreateBountyInput): Bounty {
  if (!input.communityId) throw new Error('Choose a community.');
  if (!input.title.trim()) throw new Error('Bounty title is required.');
  if (!input.summary.trim()) throw new Error('Bounty summary is required.');
  if (!Number.isFinite(input.rewardKes) || input.rewardKes <= 0) throw new Error('Reward must be greater than zero.');
  if (!input.deadline) throw new Error('Deadline is required.');

  const bounty: Bounty = {
    id: `b-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    communityId: input.communityId,
    title: input.title.trim(),
    category: input.category.trim() || 'General',
    rewardKes: input.rewardKes,
    deadline: input.deadline,
    submissions: 0,
    status: 'open',
    postedBy: input.postedBy,
    summary: input.summary.trim(),
    skills: splitSkills(input.skills),
  };

  writeLocalBounties([bounty, ...readLocalBounties()]);
  return bounty;
}

export async function createBountyRecordAsync(input: CreateBountyInput): Promise<Bounty> {
  const bounty = validateAndBuildBounty(input);
  const client = getSupabaseClient();
  if (!client) {
    writeLocalBounties([bounty, ...readLocalBounties()]);
    return bounty;
  }

  const { data, error } = await client
    .from('bounties')
    .insert({
      id: bounty.id,
      community_id: bounty.communityId,
      title: bounty.title,
      category: bounty.category,
      reward_kes: bounty.rewardKes,
      deadline: bounty.deadline,
      status: bounty.status,
      posted_by: bounty.postedBy,
      summary: bounty.summary,
      skills: bounty.skills,
    })
    .select('id,community_id,title,category,reward_kes,deadline,status,posted_by,summary,skills')
    .single();

  if (error) throw error;
  return bountyFromRow(data as BountyRow);
}

function validateAndBuildBounty(input: CreateBountyInput): Bounty {
  if (!input.communityId) throw new Error('Choose a community.');
  if (!input.title.trim()) throw new Error('Bounty title is required.');
  if (!input.summary.trim()) throw new Error('Bounty summary is required.');
  if (!Number.isFinite(input.rewardKes) || input.rewardKes <= 0) throw new Error('Reward must be greater than zero.');
  if (!input.deadline) throw new Error('Deadline is required.');

  return {
    id: `b-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    communityId: input.communityId,
    title: input.title.trim(),
    category: input.category.trim() || 'General',
    rewardKes: input.rewardKes,
    deadline: input.deadline,
    submissions: 0,
    status: 'open',
    postedBy: input.postedBy,
    summary: input.summary.trim(),
    skills: splitSkills(input.skills),
  };
}

export function submitBountyWork(input: {
  bountyId: string;
  contributor: string;
  workUrl: string;
  note: string;
}): BountySubmission {
  if (!input.bountyId) throw new Error('Choose a bounty.');
  if (!input.contributor.trim()) throw new Error('Contributor name is required.');
  if (!input.workUrl.trim()) throw new Error('Work URL is required.');

  const submission: BountySubmission = {
    id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    bountyId: input.bountyId,
    contributor: input.contributor.trim(),
    workUrl: input.workUrl.trim(),
    note: input.note.trim(),
    submittedAt: new Date().toISOString(),
  };

  writeSubmissions([submission, ...readSubmissions()]);
  return submission;
}

export async function submitBountyWorkAsync(input: {
  bountyId: string;
  contributor: string;
  workUrl: string;
  note: string;
}): Promise<BountySubmission> {
  const submission = validateAndBuildSubmission(input);
  const client = getSupabaseClient();
  if (!client) {
    writeSubmissions([submission, ...readSubmissions()]);
    return submission;
  }

  const { data, error } = await client
    .from('bounty_submissions')
    .insert({
      id: submission.id,
      bounty_id: submission.bountyId,
      contributor: submission.contributor,
      work_url: submission.workUrl,
      note: submission.note,
      submitted_at: submission.submittedAt,
    })
    .select('id,bounty_id,contributor,work_url,note,submitted_at')
    .single();

  if (error) throw error;
  return submissionFromRow(data as BountySubmissionRow);
}

function validateAndBuildSubmission(input: {
  bountyId: string;
  contributor: string;
  workUrl: string;
  note: string;
}): BountySubmission {
  if (!input.bountyId) throw new Error('Choose a bounty.');
  if (!input.contributor.trim()) throw new Error('Contributor name is required.');
  if (!input.workUrl.trim()) throw new Error('Work URL is required.');

  return {
    id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    bountyId: input.bountyId,
    contributor: input.contributor.trim(),
    workUrl: input.workUrl.trim(),
    note: input.note.trim(),
    submittedAt: new Date().toISOString(),
  };
}

export function listBountySubmissions(bountyId: string): BountySubmission[] {
  return readSubmissions()
    .filter((submission) => submission.bountyId === bountyId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function listBountySubmissionsAsync(bountyId: string): Promise<BountySubmission[]> {
  const client = getSupabaseClient();
  if (!client) return listBountySubmissions(bountyId);

  const { data, error } = await client
    .from('bounty_submissions')
    .select('id,bounty_id,contributor,work_url,note,submitted_at')
    .eq('bounty_id', bountyId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => submissionFromRow(row as BountySubmissionRow));
}

/**
 * Advance (or regress) a bounty to a new status, optionally updating the assignee.
 * Works on both seed and locally-created bounties.
 */
export function updateBountyStatus(
  bountyId: string,
  newStatus: BountyStatus,
  assignee?: string,
): Bounty | null {
  // Resolve the full bounty (merged seeds + local)
  const all = listBounties();
  const bounty = all.find((b) => b.id === bountyId);
  if (!bounty) return null;

  const updated: Bounty = { ...bounty, status: newStatus };
  // Only change assignee when caller explicitly passes a value
  if (assignee !== undefined) updated.assignee = assignee || undefined;

  const local = readLocalBounties();
  const existingIdx = local.findIndex((b) => b.id === bountyId);
  if (existingIdx >= 0) {
    local[existingIdx] = updated;
  } else {
    // Copy seed bounty into local store with overrides
    local.push(updated);
  }
  writeLocalBounties(local);
  return updated;
}

/** Set the approval status on a submitted piece of work. */
export function updateSubmissionStatus(
  submissionId: string,
  status: 'approved' | 'rejected',
): void {
  const submissions = readSubmissions();
  const idx = submissions.findIndex((s) => s.id === submissionId);
  if (idx < 0) return;
  submissions[idx] = {
    ...submissions[idx],
    status,
    reviewedAt: new Date().toISOString(),
  };
  writeSubmissions(submissions);
}

export function getBountyStatsForCommunity(communityId: string) {
  const bounties = getBountiesForCommunity(communityId);
  const open = bounties.filter((bounty) => bounty.status === 'open');
  const totalRewardKes = open.reduce((sum, bounty) => sum + bounty.rewardKes, 0);
  return {
    total: bounties.length,
    open: open.length,
    inReview: bounties.filter((bounty) => bounty.status === 'in_review').length,
    awarded: bounties.filter((bounty) => bounty.status === 'awarded').length,
    totalRewardKes,
    featured: open[0] ?? bounties[0] ?? null,
  };
}
