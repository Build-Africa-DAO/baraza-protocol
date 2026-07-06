import { describe, expect, it } from 'vitest';

import { buildCouncilSessionContext as buildFromLibIndex } from '@/lib/akili';
import { routeToCouncilAgent } from '@/lib/akili/council';
import { COUNCIL_AGENTS } from '@/lib/akili/prompts';

describe('Akili legacy lib import surface', () => {
  it('keeps legacy @/lib/akili imports resolvable', () => {
    expect(routeToCouncilAgent('check quorum before this vote')).toBe('kofi');
    expect(COUNCIL_AGENTS.nia.displayName).toBe('Nia');
    expect(buildFromLibIndex(['nia', 'kofi'])).toContain('[COUNCIL CONTEXT]');
  });
});
