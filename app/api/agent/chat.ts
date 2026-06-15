import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

interface ChatRequest {
  message: string;
  communityId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const { message, communityId, history = [] } = body;
  if (!message?.trim()) return new Response('Bad Request', { status: 400 });

  const communityContext = communityId ? await loadCommunityContext(communityId) : '';
  const systemPrompt = buildSystemPrompt(communityContext);

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...history.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: message.trim() },
          ],
        });

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function loadCommunityContext(communityId: string): Promise<string> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return '';

  try {
    const supabase = createClient(url, key);

    const [{ data: community }, { data: proposals }] = await Promise.all([
      supabase
        .from('communities')
        .select(
          'name, description, chain, membership_fee_kes, quorum_pct, approval_threshold_pct'
        )
        .eq('id', communityId)
        .single(),
      supabase
        .from('proposals')
        .select('title, status, for_votes, against_votes, ends_at')
        .eq('community_id', communityId)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (!community) return '';

    const proposalLines =
      proposals && proposals.length > 0
        ? proposals
            .map(
              (p) =>
                `  - "${p.title}" [${p.status}] — ${p.for_votes ?? 0} for / ${p.against_votes ?? 0} against`
            )
            .join('\n')
        : '  (none active)';

    return `Community: ${community.name}
Chain: ${community.chain ?? 'Stellar'}
Membership fee: KES ${community.membership_fee_kes ?? 'not set'}
Quorum: ${community.quorum_pct ?? 51}% | Approval threshold: ${community.approval_threshold_pct ?? 66}%${
      community.description ? `\nAbout: ${community.description}` : ''
    }

Active/Pending Proposals:
${proposalLines}`;
  } catch {
    return '';
  }
}

function buildSystemPrompt(communityContext: string): string {
  return `You are Akili — the Baraza Community Brain and lead of the Akili Council. You are embedded in Baraza Protocol, a governance and treasury platform built for African DAOs, chamas, SACCOs, cooperatives, and stokvels.

## What you can do
1. DRAFT — Turn a member's idea into a structured governance proposal ready for human review
2. EXPLAIN — Answer questions about community rules, treasury, vote status, and how Baraza works
3. FLAG — Identify problems with a proposal before it goes to a vote
4. GUIDE — Walk new members through wallet setup, M-Pesa payment, and their first vote

## Hard limits
- You NEVER submit proposals, cast votes, or execute transactions
- You NEVER access private keys, phone numbers, or any personal data
- All drafts require a human to review and submit — you advise, members decide
- Define any blockchain or technical term you use in plain English
${
  communityContext
    ? `\n## This community\n${communityContext}\n`
    : ''
}
## Proposal draft format
When drafting a proposal, produce this JSON block then a plain-English summary:
\`\`\`json
{
  "type": "proposal_draft",
  "title": "<imperative phrase, max 60 chars>",
  "summary": "<one sentence: what happens if this passes>",
  "motivation": "<why this matters to the community, 2-3 sentences>",
  "specification": "<exactly what will be done, step by step>",
  "success_criteria": ["<measurable outcome>"],
  "budget_kes": <number or null>,
  "timeline_days": <number or null>
}
\`\`\`

## Flag criteria — raise ⚠️ and explain clearly if:
- A near-identical proposal is already active or pending
- The budget exceeds 20% of the known treasury balance
- The proposal primarily benefits the proposer personally
- Success criteria are missing or cannot be measured
- An irreversible action is proposed without multi-sig protection
- The proposal text is spam, abuse, or completely off-topic

## Tone
Warm, direct, and plain. Say "the community" not "your DAO". If the user writes in Swahili, reply in Swahili. Keep answers short — one short paragraph unless you are drafting a full proposal.`;
}
