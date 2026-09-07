import { describe, expect, it } from 'vitest';
import {
  getGroupIdFromPath,
  isSafeReturnTo,
  isStayPath,
  parseJoinTarget,
  resolvePostAuthPath,
} from '@/lib/postAuth';

describe('isStayPath', () => {
  it('keeps the member in join, dashboard, and create flows', () => {
    expect(isStayPath('/join/abc')).toBe(true);
    expect(isStayPath('/dashboard/abc?tab=governance')).toBe(true);
    expect(isStayPath('/create/purpose')).toBe(true);
    expect(isStayPath('/communities')).toBe(true);
  });

  it('does not treat the marketing homepage as a stay path', () => {
    expect(isStayPath('/')).toBe(false);
    expect(isStayPath('/#faq')).toBe(false);
  });
});

describe('isSafeReturnTo', () => {
  it('accepts in-app paths and rejects open redirects', () => {
    expect(isSafeReturnTo('/join/abc')).toBe(true);
    expect(isSafeReturnTo('https://evil.example')).toBe(false);
    expect(isSafeReturnTo('//evil.example')).toBe(false);
    expect(isSafeReturnTo('/api/secret')).toBe(false);
  });
});

describe('resolvePostAuthPath', () => {
  it('resumes a return-to deep link', () => {
    expect(resolvePostAuthPath({
      entryPath: '/',
      returnTo: '/join/chama-1',
      memberships: [],
    })).toBe('/join/chama-1');
  });

  it('stays on the page where login started when that page is in-app', () => {
    expect(resolvePostAuthPath({
      entryPath: '/communities',
      memberships: [{ communityId: 'only', status: 'active' }],
    })).toBe('/communities');
  });

  it('opens the only active group after login from marketing', () => {
    expect(resolvePostAuthPath({
      entryPath: '/',
      memberships: [{ communityId: 'only', status: 'active' }],
    })).toBe('/dashboard/only');
  });

  it('sends first-run and multi-group members to My Groups', () => {
    expect(resolvePostAuthPath({ entryPath: '/', memberships: [] })).toBe('/home');
    expect(resolvePostAuthPath({
      entryPath: '/',
      memberships: [
        { communityId: 'a', status: 'active' },
        { communityId: 'b', status: 'active' },
      ],
    })).toBe('/home');
  });
});

describe('parseJoinTarget', () => {
  it('reads a community id from an invite URL or raw id', () => {
    expect(parseJoinTarget('https://www.barazaprotocol.com/join/chama-9?ref=invite')).toBe('chama-9');
    expect(parseJoinTarget('/join/chama-9')).toBe('chama-9');
    expect(parseJoinTarget('chama-9')).toBe('chama-9');
    expect(parseJoinTarget('not a link')).toBe(null);
  });
});

describe('getGroupIdFromPath', () => {
  it('extracts the group id from workspace routes', () => {
    expect(getGroupIdFromPath('/dashboard/abc/treasury')).toBe('abc');
    expect(getGroupIdFromPath('/dao/abc/vote')).toBe('abc');
    expect(getGroupIdFromPath('/join/abc')).toBe('abc');
    expect(getGroupIdFromPath('/home')).toBe(null);
  });
});
