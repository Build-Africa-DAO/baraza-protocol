import type { Comment, Proposal, VoteOption } from '@/types';

const COMMENT_KEY = 'baraza.proposalComments.v1';
const AUDIT_KEY = 'baraza.proposalAudit.v1';

export interface ProposalAuditEntry {
  id: string;
  proposalId: string;
  action: string;
  actor: string;
  createdAt: string;
  txHash?: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listProposalComments(proposalId: string): Comment[] {
  return readJson<Record<string, Comment[]>>(COMMENT_KEY, {})[proposalId] ?? [];
}

export function addProposalComment(input: {
  proposalId: string;
  memberId: string;
  body: string;
}): Comment {
  if (!input.body.trim()) throw new Error('Comment cannot be empty.');
  const all = readJson<Record<string, Comment[]>>(COMMENT_KEY, {});
  const comment: Comment = {
    id: `comment_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    proposalId: input.proposalId,
    memberId: input.memberId,
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
  };
  all[input.proposalId] = [comment, ...(all[input.proposalId] ?? [])];
  writeJson(COMMENT_KEY, all);
  addProposalAuditEntry({
    proposalId: input.proposalId,
    actor: input.memberId,
    action: 'comment.added',
  });
  return comment;
}

export function listProposalAuditTrail(proposalId: string): ProposalAuditEntry[] {
  return readJson<Record<string, ProposalAuditEntry[]>>(AUDIT_KEY, {})[proposalId] ?? [];
}

export function addProposalAuditEntry(input: {
  proposalId: string;
  actor: string;
  action: string;
  txHash?: string;
}): ProposalAuditEntry {
  const all = readJson<Record<string, ProposalAuditEntry[]>>(AUDIT_KEY, {});
  const entry: ProposalAuditEntry = {
    id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    proposalId: input.proposalId,
    actor: input.actor,
    action: input.action,
    txHash: input.txHash,
    createdAt: new Date().toISOString(),
  };
  all[input.proposalId] = [entry, ...(all[input.proposalId] ?? [])];
  writeJson(AUDIT_KEY, all);
  return entry;
}

export function voteOptionLabel(option: VoteOption): string {
  if (option === 'yes') return 'Yes';
  if (option === 'no') return 'No';
  return 'Abstain';
}

export function createDisciplinaryProposal(input: {
  communityId: string;
  targetMemberId: string;
  reason: string;
  createdBy: string;
}): Proposal {
  const now = new Date().toISOString();
  return {
    id: `disciplinary_${Date.now().toString(36)}`,
    communityId: input.communityId,
    title: 'Disciplinary review',
    description: input.reason,
    kind: 'disciplinary-action',
    status: 'draft',
    createdBy: input.createdBy,
    createdAt: now,
    votes: [],
    comments: [],
    auditTrail: [{
      id: `audit_${Date.now().toString(36)}`,
      action: `disciplinary.created:${input.targetMemberId}`,
      actor: input.createdBy,
      createdAt: now,
    }],
  };
}
