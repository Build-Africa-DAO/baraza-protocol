import type { AkiliChatMode } from '@/akili/akili-chat-context';

export type ChatStreamErrorCategory = 'credits_exhausted' | 'auth_failed' | 'rate_limited' | 'overloaded' | 'unknown';

export class ChatStreamError extends Error {
  category: ChatStreamErrorCategory;

  constructor(category: ChatStreamErrorCategory, message: string) {
    super(message);
    this.name = 'ChatStreamError';
    this.category = category;
  }
}

export interface AkiliHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export async function streamAkiliResponse(
  message: string,
  communityId: string | null,
  history: AkiliHistoryItem[],
  onChunk: (text: string) => void,
  mode: AkiliChatMode,
): Promise<void> {
  const akiliBase = (import.meta.env.VITE_AKILI_API_URL as string | undefined)?.replace(/\/$/, '');
  const endpoint = akiliBase ? `${akiliBase}/api/chat` : '/api/agent/chat';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, communityId: communityId ?? undefined, history, mode }),
  });

  if (!response.ok || !response.body) throw new ChatStreamError('unknown', 'Akili is unavailable.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') return;
      try {
        const parsed = JSON.parse(payload) as { text?: string; category?: ChatStreamErrorCategory; message?: string };
        if (parsed.text) onChunk(parsed.text);
        if (parsed.category) throw new ChatStreamError(parsed.category, parsed.message ?? 'Akili is unavailable.');
      } catch (error) {
        if (error instanceof ChatStreamError) throw error;
      }
    }
  }
}

export function getAkiliFallback(input: string): string {
  const value = input.toLowerCase();
  if (/vote|proposal|decision/.test(value)) return 'I can explain an open decision and take you to its full page. Your vote is never inferred or submitted from this chat.';
  if (/bount|task|work/.test(value)) return 'I can find community tasks by skill, group, status, or reward and link you to the full brief.';
  if (/join|community|group|chama|sacco/.test(value)) return 'I can compare communities by purpose, contribution, and open decisions, then take you to the group or joining page.';
  return 'I can help you find communities, open decisions, community tasks, and the right place to take your next step.';
}

export function getFacilitatorFallback(input: string): string {
  const sources = Array.from(
    input.matchAll(/\[([^\]]+)]\s*([^:\n]+):\s*([^\n]+)/g),
    (match) => ({ id: match[1], author: match[2].trim(), body: match[3].trim() }),
  );
  if (sources.length === 0) {
    return 'There are not enough source messages to summarise yet. I will not recommend or cast a vote.';
  }
  const points = sources.map((source) => `- ${source.author}: ${source.body} [#${source.id}]`).join('\n');
  const unanswered = sources
    .filter((source) => /\?|confirm|clarify|share|before/i.test(source.body))
    .map((source) => `- Follow up on ${source.author}'s point [#${source.id}]`)
    .join('\n');
  return `Discussion summary\n${points}\n\nUnanswered questions\n${unanswered || '- None identified from the available messages.'}\n\nMinority views\n- Not enough distinct positions are present to identify a minority view.\n\nNo voting recommendation has been made.`;
}
