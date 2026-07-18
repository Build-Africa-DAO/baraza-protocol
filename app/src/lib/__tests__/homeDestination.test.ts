import { describe, expect, it } from 'vitest';
import { getHomeDestination, shouldShowHomeNavigation } from '@/lib/homeDestination';

describe('getHomeDestination', () => {
  it('opens the welcome experience for a new visitor', () => {
    expect(getHomeDestination({ communityIds: [], identified: false, lastInterface: null })).toBe('/');
  });

  it('opens the member dashboard for a returning platform user', () => {
    expect(getHomeDestination({ communityIds: ['1'], identified: true, lastInterface: 'platform' })).toBe('/dashboard/1');
  });

  it('opens Akili with the member dashboard context for a returning chat user', () => {
    expect(getHomeDestination({ communityIds: ['1'], identified: true, lastInterface: 'chat' })).toBe('/akili?from=%2Fdashboard%2F1');
  });

  it('opens Akili for an identified user who has not joined a community', () => {
    expect(getHomeDestination({ communityIds: [], identified: true, lastInterface: 'platform' })).toBe('/akili?from=%2Fcommunities');
  });
});

describe('shouldShowHomeNavigation', () => {
  it('hides navigation that would reload the current dashboard', () => {
    expect(shouldShowHomeNavigation('/dashboard/1', '/dashboard/1')).toBe(false);
  });

  it('shows the member destination from Explore', () => {
    expect(shouldShowHomeNavigation('/communities', '/dashboard/1')).toBe(true);
  });

  it('compares destinations without query strings or trailing slashes', () => {
    expect(shouldShowHomeNavigation('/akili/', '/akili?from=%2Fcommunities')).toBe(false);
  });
});
