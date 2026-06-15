import { describe, expect, it } from 'vitest';
import { COUNCIL_AGENTS, routeToCouncilAgent, type CouncilAgentName } from '@/lib/akili';
import { buildCouncilSessionContext } from '@/lib/akili/council';
import {
  AKILI_PRINCIPALS,
  AKILI_RELAY,
  DECISION_STACK_GUARD,
  FACT_LOCKS,
  SIGNATURE_PHRASES,
  buildRelationshipTensionContext,
  listTensionPairs,
  type AkiliPrincipalName,
} from '@/lib/akili/prompts';

describe('Akili Council registry', () => {
  it('exposes exactly the five named agents', () => {
    const names: CouncilAgentName[] = ['amara', 'kofi', 'zara', 'nia', 'seku'];
    expect(Object.keys(COUNCIL_AGENTS).sort()).toEqual([...names].sort());
  });

  it('every agent has a non-empty system prompt and stated role', () => {
    for (const agent of Object.values(COUNCIL_AGENTS)) {
      expect(agent.systemPrompt.length).toBeGreaterThan(200);
      expect(agent.role.trim()).not.toEqual('');
      expect(agent.displayName.trim()).not.toEqual('');
    }
  });

  it('agent prompts each name their own agent', () => {
    for (const agent of Object.values(COUNCIL_AGENTS)) {
      expect(agent.systemPrompt).toContain(`You are ${agent.displayName}`);
    }
  });
});

describe('routeToCouncilAgent', () => {
  it.each<[string, CouncilAgentName]>([
    ['Write a WhatsApp announcement for the next vote', 'seku'],
    ['Draft an SMS reminder for dues', 'seku'],
    ['Is this proposal compliant with Kenya KYC rules?', 'zara'],
    ['Does this trigger any tax obligation?', 'zara'],
    ['What are other chamas in Nairobi doing about loan defaults?', 'nia'],
    ['Show me market trends for similar SACCOs', 'nia'],
    ['How is the community doing on turnout this month?', 'amara'],
    ['Member churn looks high — what changed?', 'amara'],
    ['Should this proposal pass given the treasury impact?', 'kofi'],
    ['Recommend a quorum for a 20-member chama', 'kofi'],
  ])('routes %j → %s', (message, expected) => {
    expect(routeToCouncilAgent(message)).toEqual(expected);
  });

  it('falls back to kofi on ambiguous input', () => {
    expect(routeToCouncilAgent('hello')).toEqual('kofi');
    expect(routeToCouncilAgent('?')).toEqual('kofi');
  });
});

describe('Akili relay', () => {
  it('AKILI_RELAY identifies as the relay and is not on the three axes', () => {
    expect(AKILI_RELAY.name).toEqual('akili');
    expect(AKILI_RELAY.displayName).toEqual('Akili');
    expect(AKILI_RELAY.castPosition).toContain('indigo');
    expect(AKILI_RELAY.systemPrompt).toContain('You are Akili');
  });

  it('relay prompt embeds the Decision Stack Guard verbatim', () => {
    expect(AKILI_RELAY.systemPrompt).toContain(DECISION_STACK_GUARD);
    expect(AKILI_RELAY.systemPrompt).toContain('One signal is missing. We wait.');
  });

  it('relay prompt forbids greeting', () => {
    expect(AKILI_RELAY.systemPrompt.toLowerCase()).toContain('never greet');
  });

  it('AKILI_PRINCIPALS contains all six principals', () => {
    const names: AkiliPrincipalName[] = ['amara', 'kofi', 'zara', 'nia', 'seku', 'akili'];
    expect(Object.keys(AKILI_PRINCIPALS).sort()).toEqual([...names].sort());
  });
});

describe('Canonical Fact Locks', () => {
  it('every principal has 5–8 fact lock items', () => {
    for (const [name, locks] of Object.entries(FACT_LOCKS)) {
      expect(locks.length, `${name} fact lock count`).toBeGreaterThanOrEqual(5);
      expect(locks.length, `${name} fact lock count`).toBeLessThanOrEqual(8);
    }
  });

  it('all fact lock items are non-empty strings', () => {
    for (const locks of Object.values(FACT_LOCKS)) {
      for (const item of locks) {
        expect(item.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('Amara fact lock cites Episode 03 and the Taarab corpus', () => {
    const joined = FACT_LOCKS.amara.join('\n');
    expect(joined).toContain('Episode 03');
    expect(joined).toContain('Taarab');
  });

  it('Kofi fact lock cites Kumasi and the Kisumu hardship workaround', () => {
    const joined = FACT_LOCKS.kofi.join('\n');
    expect(joined).toContain('Kumasi');
    expect(joined).toContain('Kisumu');
  });

  it('Akili fact lock cites the week-six Nia-flatten and the Decision Stack Guard', () => {
    const joined = FACT_LOCKS.akili.join('\n');
    expect(joined).toContain('Nia-flatten');
    expect(joined).toContain('Decision Stack Guard');
  });
});

describe('Signature Phrases', () => {
  it('every principal has 5 signature phrases', () => {
    for (const [name, phrases] of Object.entries(SIGNATURE_PHRASES)) {
      expect(phrases.length, `${name} signature phrase count`).toEqual(5);
    }
  });

  it('signature phrases are mentioned in their owner\'s system prompt', () => {
    for (const [name, phrases] of Object.entries(SIGNATURE_PHRASES)) {
      const principal = AKILI_PRINCIPALS[name as AkiliPrincipalName];
      // At least three of the five must appear verbatim in the prompt;
      // some are templated (e.g. "<X>") and may not match exactly.
      const hits = phrases.filter((phrase) => principal.systemPrompt.includes(phrase));
      expect(hits.length, `${name} phrases in prompt`).toBeGreaterThanOrEqual(3);
    }
  });

  it('Akili guard phrase is verbatim and exact', () => {
    expect(SIGNATURE_PHRASES.akili).toContain('One signal is missing. We wait.');
  });
});

describe('Relationship Tension Context', () => {
  it('returns empty for solo and zero-agent sessions', () => {
    expect(buildRelationshipTensionContext([])).toEqual('');
    expect(buildRelationshipTensionContext(['amara'])).toEqual('');
  });

  it('surfaces the Kofi↔Seku epistemological tension when both are active', () => {
    const ctx = buildRelationshipTensionContext(['kofi', 'seku']);
    expect(ctx).toContain('Kofi ↔ Seku');
    expect(ctx).toContain("Neither trusts the other's starting point");
  });

  it('surfaces the asymmetric Seku→Nia tension as one-way', () => {
    const ctx = buildRelationshipTensionContext(['nia', 'seku']);
    expect(ctx).toContain('Seku → Nia (one-way, asymmetric)');
    expect(ctx).toContain('[NIA-co-sign]');
    expect(ctx).not.toContain('Nia → Seku');
  });

  it('Amara+Nia tension names warmth and the escalation asymmetry', () => {
    const ctx = buildRelationshipTensionContext(['amara', 'nia']);
    expect(ctx).toContain('warmest pair');
    expect(ctx).toContain('Amara escalates when Nia stalls');
  });

  it('multi-agent session surfaces multiple tension lines', () => {
    const ctx = buildRelationshipTensionContext(['amara', 'kofi', 'seku', 'zara']);
    expect(ctx).toContain('Kofi ↔ Seku');
    expect(ctx).toContain('Amara ↔ Zara');
  });

  it('encoded tension lines cover the documented asymmetries', () => {
    const pairs = listTensionPairs();
    const keys = pairs.map(([a, b]) => [a, b].sort().join('|'));
    expect(keys).toContain('kofi|seku');
    expect(keys).toContain('amara|zara');
    expect(keys).toContain('nia|seku');
    expect(keys).toContain('kofi|nia');
    expect(keys).toContain('amara|nia');
  });
});
