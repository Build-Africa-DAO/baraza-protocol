import { describe, expect, it } from 'vitest';
import { COUNCIL_AGENTS, routeToCouncilAgent } from '@/lib/akili';
import { buildCouncilSessionContext } from '@/lib/akili/council';
import { AKILI_RELAY, SIGNATURE_PHRASES } from '@/lib/akili/prompts';

describe('Akili compatibility exports', () => {
  it('resolves the legacy lib import surface', () => {
    expect(Object.keys(COUNCIL_AGENTS).sort()).toEqual(['amara', 'kofi', 'nia', 'seku', 'zara']);
    expect(routeToCouncilAgent('Recommend a quorum')).toEqual('kofi');
    expect(buildCouncilSessionContext(['akili'])).toContain('GUARD: Community signal incomplete');
    expect(AKILI_RELAY.name).toEqual('akili');
    expect(SIGNATURE_PHRASES.akili).toContain('One signal is missing. We wait.');
  });
});
