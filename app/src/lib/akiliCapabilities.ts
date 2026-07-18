import type { Bounty } from '@/lib/bounties';
import type { Community, Decision } from '@/lib/dataStore';
import { buildFacilitatorExcerpt, listProposalThread } from '@/lib/proposalThreads';

export type AkiliResourceKind = 'community' | 'decision' | 'task' | 'destination' | 'discussion';

export interface AkiliResourceRef {
  kind: AkiliResourceKind;
  id: string;
  href: string;
  actionLabel: string;
}

export interface AkiliCapabilityReply {
  text: string;
  resources: AkiliResourceRef[];
  suggestions: string[];
}

export interface AkiliCapabilityContext {
  communities: Community[];
  decisions: Decision[];
  bounties: Bounty[];
}

export const AKILI_CAPABILITIES = [
  { id: 'discover-communities', access: 'read', description: 'Find and compare communities', route: '/communities' },
  { id: 'review-decisions', access: 'read', description: 'Explain and link to open decisions', route: '/communities' },
  { id: 'summarize-discussion', access: 'read', description: 'Summarize sourced member discussion', route: '/communities' },
  { id: 'discover-tasks', access: 'read', description: 'Find community tasks', route: '/bounties' },
  { id: 'navigate', access: 'read', description: 'Open an exact platform destination', route: '/' },
] as const;

const STOP_WORDS = new Set(['show', 'find', 'tell', 'about', 'what', 'which', 'with', 'from', 'open', 'please']);
const SETUP_ONLY_TERMS = /\b(?:treasury|governance|daos?|blockchain|nfts?|wallet|crypto|solana|stellar|celo|evm|devnet)\b|on[\s-]?chain/i;
const queryTerms = (input: string) => input.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((term) => term.length > 2 && !STOP_WORDS.has(term));
const includesAny = (input: string, values: string[]) => values.some((value) => input.includes(value));
const matches = (values: string[], query: string[]) => query.length === 0 || query.some((term) => values.join(' ').toLowerCase().includes(term));
const isMemberFacingTask = (task: Bounty) => !SETUP_ONLY_TERMS.test([task.title, task.summary, task.category, ...task.skills].join(' '));

export const buildCommunityRoute = (id: string) => `/dashboard/${id}`;
export const buildDecisionRoute = (communityId: string, decisionId: string) => `/dashboard/${communityId}/decisions/${decisionId}`;
export const buildTaskRoute = (id: string) => `/bounties/${id}`;

export function resolveAkiliCapability(input: string, context: AkiliCapabilityContext): AkiliCapabilityReply {
  const lower = input.trim().toLowerCase();
  const query = queryTerms(input);

  if (includesAny(lower, ['summar', 'discussion', 'members saying', 'conversation'])) {
    const decision = context.decisions.find((item) => matches([item.title, item.description], query));
    if (decision) {
      const messages = listProposalThread(decision.id);
      return {
        text: messages.length > 0 ? `Here is the sourced discussion for “${decision.title}”.\n\n${buildFacilitatorExcerpt(messages)}` : `There are no member messages on “${decision.title}” yet.`,
        resources: [{ kind: 'discussion', id: decision.id, href: `${buildDecisionRoute(decision.communityId, decision.id)}#community-discussion`, actionLabel: 'Open discussion' }],
        suggestions: ['Show open decisions', 'Find community work', 'Compare communities'],
      };
    }
  }

  if (includesAny(lower, ['vote', 'proposal', 'decision', 'attention'])) {
    const found = context.decisions.filter((item) => item.status === 'active' && matches([item.title, item.description], query)).slice(0, 4);
    const decisions = found.length > 0 ? found : context.decisions.filter((item) => item.status === 'active').slice(0, 4);
    return {
      text: `I found ${decisions.length} open ${decisions.length === 1 ? 'decision' : 'decisions'}. I can explain them here; voting stays on the full decision page so the choice and group rules remain visible.`,
      resources: decisions.map((item) => ({ kind: 'decision', id: item.id, href: `${buildDecisionRoute(item.communityId, item.id)}?intent=vote`, actionLabel: 'Review and vote' })),
      suggestions: ['Summarize a decision discussion', 'Find community work', 'Compare communities'],
    };
  }

  if (includesAny(lower, ['bounty', 'task', 'work', 'paid', 'skill', 'deadline'])) {
    const visibleBounties = context.bounties.filter(isMemberFacingTask);
    const found = visibleBounties.filter((item) => matches([item.title, item.summary, item.category, ...item.skills], query)).slice(0, 4);
    const bounties = found.length > 0 ? found : visibleBounties.filter((item) => item.status === 'open' || item.status === 'in_progress').slice(0, 4);
    return {
      text: `These ${bounties.length} community ${bounties.length === 1 ? 'task matches' : 'tasks match'} your question. Open a task for its full brief and submission steps.`,
      resources: bounties.map((item) => ({ kind: 'task', id: item.id, href: buildTaskRoute(item.id), actionLabel: 'Open task' })),
      suggestions: ['Show open decisions', 'Find a savings group', 'Start a community'],
    };
  }

  if (includesAny(lower, ['community', 'group', 'chama', 'sacco', 'cooperative', 'join', 'compare'])) {
    const found = context.communities.filter((item) => matches([item.name, item.description, item.type], query)).slice(0, 4);
    const communities = found.length > 0 ? found : context.communities.slice(0, 4);
    return {
      text: 'Compare these communities by what members do together, their regular contribution, and current decisions.',
      resources: communities.map((item) => ({ kind: 'community', id: item.id, href: buildCommunityRoute(item.id), actionLabel: 'Open community' })),
      suggestions: ['Show open decisions', 'Find community work', 'Start a community'],
    };
  }

  if (includesAny(lower, ['start', 'launch', 'create'])) {
    return {
      text: 'The guided setup asks about your group’s purpose, contributions, decision rules, and withdrawal approvers. Your progress is saved on this device.',
      resources: [{ kind: 'destination', id: 'create', href: '/create', actionLabel: 'Start setup' }],
      suggestions: ['Compare communities', 'How does voting work?', 'Find community work'],
    };
  }

  return {
    text: 'Ask me to compare communities, show open decisions, summarize a member discussion, or find community work.',
    resources: [
      { kind: 'destination', id: 'communities', href: '/communities', actionLabel: 'Browse communities' },
      { kind: 'destination', id: 'bounties', href: '/bounties', actionLabel: 'Browse community work' },
    ],
    suggestions: ['What needs my attention?', 'Compare communities', 'Find community work'],
  };
}
