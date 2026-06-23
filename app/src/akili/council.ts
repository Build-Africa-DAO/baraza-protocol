import Anthropic from '@anthropic-ai/sdk';
import {
  COUNCIL_AGENTS,
  buildRelationshipTensionContext,
  type AkiliPrincipalName,
  type CouncilAgent,
  type CouncilAgentName,
} from '@/akili/prompts';

const COUNCIL_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 1024;

const ALL_PRINCIPALS: ReadonlyArray<AkiliPrincipalName> = [
  'amara',
  'kofi',
  'zara',
  'nia',
  'seku',
  'akili',
];

const DECISION_STACK_GUARD_PREPEND =
  'GUARD: Community signal incomplete. Nia and Kofi must both be present before Step 1 clears. Do not proceed to Step 2.';

export interface InvokeCouncilOptions {
  /** Override max output tokens. Defaults to 1024. */
  maxTokens?: number;
  /** Extra plain-text context appended to the system prompt (e.g. community snapshot). */
  context?: string;
  /** Explicit API key. Defaults to ANTHROPIC_API_KEY env var. */
  apiKey?: string;
  /**
   * Principals active in this session. When two or more are present, the
   * matching relationship tension lines are injected *between* the system
   * prompt and the user message. When Akili is among them, the full tension
   * block fires regardless of which other agents are present, and the
   * Decision Stack Guard prepend fires whenever Nia and Kofi are not both
   * also present. Defaults to `[]` — no injection.
   */
  activePrincipals?: ReadonlyArray<AkiliPrincipalName>;
}

export interface InvokeCouncilResult {
  agent: CouncilAgentName;
  text: string;
}

/**
 * Invoke one of the five Akili council agents with a user message.
 * Returns the first text block of the response.
 *
 * Council agents are one-shot specialists. For multi-turn conversation,
 * use the streaming chat brain at `/api/agent/chat` instead.
 *
 * Prompt caching is enabled on the agent system prompt so repeated calls
 * to the same agent reuse cached tokens.
 */
export async function invokeCouncilAgent(
  agent: CouncilAgentName,
  message: string,
  options: InvokeCouncilOptions = {},
): Promise<InvokeCouncilResult> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Council message cannot be empty');
  }

  const definition = COUNCIL_AGENTS[agent];
  const client = new Anthropic({ apiKey });

  const systemBlocks = buildSystemBlocks(definition, options.context);
  const sessionContext = buildCouncilSessionContext(options.activePrincipals ?? []);
  const userContent = sessionContext ? `${sessionContext}\n\n${trimmed}` : trimmed;

  const response = await client.messages.create({
    model: COUNCIL_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: systemBlocks,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return { agent, text };
}

/**
 * Build the per-session context block injected between the system prompt and
 * the user message when two or more council principals are active. The block
 * is wrapped in `[COUNCIL CONTEXT] … [END COUNCIL CONTEXT]` so the agent can
 * distinguish session-specific friction from its character-permanent prompt.
 *
 * Behaviour:
 *   • Fewer than two principals and Akili not active → empty string (silent skip).
 *   • Akili among active principals → full tension block (all five lines),
 *     regardless of which other agents are present.
 *   • Otherwise → only the tension lines whose both principals are present.
 *   • If Akili is active and Nia OR Kofi is missing, the Decision Stack Guard
 *     prepend fires before the tension block.
 *
 * Asymmetric tension lines (Seku→Nia, Kofi→Nia) stay directional. They are
 * never flattened.
 */
export function buildCouncilSessionContext(
  activePrincipals: ReadonlyArray<AkiliPrincipalName>,
): string {
  const akiliActive = activePrincipals.includes('akili');
  const niaActive = activePrincipals.includes('nia');
  const kofiActive = activePrincipals.includes('kofi');

  const parts: string[] = [];

  if (akiliActive && !(niaActive && kofiActive)) {
    parts.push(DECISION_STACK_GUARD_PREPEND);
  }

  if (activePrincipals.length >= 2) {
    const tensionBlock = akiliActive
      ? buildRelationshipTensionContext(ALL_PRINCIPALS)
      : buildRelationshipTensionContext(activePrincipals);
    if (tensionBlock) parts.push(tensionBlock);
  }

  if (parts.length === 0) return '';

  return ['[COUNCIL CONTEXT]', ...parts, '[END COUNCIL CONTEXT]'].join('\n\n');
}

function buildSystemBlocks(
  agent: CouncilAgent,
  context?: string,
): Anthropic.MessageCreateParams['system'] {
  const blocks: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }> = [
    {
      type: 'text',
      text: agent.systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ];
  if (context?.trim()) {
    blocks.push({ type: 'text', text: `## Current context\n${context.trim()}` });
  }
  return blocks;
}

/**
 * Light keyword router — chooses a council agent for a free-text request.
 * Used when the caller does not specify which agent to consult. It is a
 * heuristic, not a classifier: when the signal is weak, fall back to Kofi
 * (governance) since that is the most common Baraza ask.
 *
 * NOTE on bible-vs-router split: the character bibles in
 * `docs/akili-council/` describe each agent's *editorial* domain (Amara
 * = Content & Media, Nia = People, etc.). The router below is the
 * *functional* dispatch layer Aziz curated — it intentionally diverges
 * from a strict bible-domain match. The tests in
 * `app/src/lib/__tests__/akili.test.ts` encode the router as product
 * contract: change the router only when you change the tests too.
 *
 * Current routing intent (from the tests):
 *   - amara — community telemetry (turnout, churn, growth, engagement)
 *   - kofi  — proposals, quorum, treasury impact, default
 *   - zara  — compliance scope (KYC, tax, AML, VASP)
 *   - nia   — external comparison + cross-community research
 *   - seku  — outbound copy (announcements, WhatsApp, SMS, reminders)
 */
export function routeToCouncilAgent(message: string): CouncilAgentName {
  const m = message.toLowerCase();

  if (/(announce|message|recap|reminder|whatsapp|sms|copy|caption|script|broadcast)/.test(m)) {
    return 'seku';
  }
  if (/(kyc|aml|tax|sanction|regulator|license|licence|vasp|compliance|legal)/.test(m)) {
    return 'zara';
  }
  if (/(research|trend|market|benchmark|comparable|industry|landscape|other (chamas|saccos|stokvels|communities|groups|daos))/.test(m)) {
    return 'nia';
  }
  if (/(turnout|participation|members|growth|churn|engagement|attendance|how is the community)/.test(m)) {
    return 'amara';
  }
  // Default: governance analysis (proposals, quorum, voting, treasury impact)
  return 'kofi';
}

export { COUNCIL_AGENTS } from '@/akili/prompts';
export type { CouncilAgent, CouncilAgentName } from '@/akili/prompts';
