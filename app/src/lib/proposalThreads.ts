const THREAD_KEY = 'baraza.proposalThreads.v1';

export interface ProposalThreadMessage {
  id: string;
  proposalId: string;
  authorId: string;
  authorName: string;
  body: string;
  mentions: string[];
  parentId?: string;
  createdAt: string;
}

export interface AddProposalThreadMessageInput {
  proposalId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId?: string;
}

function readThreads(): Record<string, ProposalThreadMessage[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(THREAD_KEY);
    return raw ? JSON.parse(raw) as Record<string, ProposalThreadMessage[]> : {};
  } catch {
    return {};
  }
}

function writeThreads(threads: Record<string, ProposalThreadMessage[]>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THREAD_KEY, JSON.stringify(threads));
}

export function extractMentions(body: string): string[] {
  return [...new Set(
    Array.from(
      body.matchAll(/@([\p{L}\p{N}](?:[\p{L}\p{N}._-]*[\p{L}\p{N}])?)/gu),
      (match) => match[1],
    ),
  )];
}

export function listProposalThread(proposalId: string): ProposalThreadMessage[] {
  return readThreads()[proposalId] ?? [];
}

export function addProposalThreadMessage(
  input: AddProposalThreadMessageInput,
): ProposalThreadMessage {
  const body = input.body.trim();
  if (!body) throw new Error('Write a message before posting.');

  const threads = readThreads();
  const current = threads[input.proposalId] ?? [];
  if (input.parentId && !current.some((message) => message.id === input.parentId)) {
    throw new Error('The message you are replying to is no longer available.');
  }

  const message: ProposalThreadMessage = {
    id: `thread_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    proposalId: input.proposalId,
    authorId: input.authorId,
    authorName: input.authorName.trim() || 'Member',
    body,
    mentions: extractMentions(body),
    parentId: input.parentId,
    createdAt: new Date().toISOString(),
  };

  threads[input.proposalId] = [...current, message];
  writeThreads(threads);
  return message;
}

export function buildFacilitatorExcerpt(messages: ProposalThreadMessage[]): string {
  if (messages.length === 0) return 'There are no community messages yet.';
  return messages
    .slice(-30)
    .map((message) => `[${message.id}] ${message.authorName}: ${message.body}`)
    .join('\n');
}
