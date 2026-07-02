import { beforeEach, describe, expect, it } from 'vitest';
import {
  createMemberProfile,
  deriveMemberName,
  normalizeMemberProfile,
  readMemberProfile,
  writeMemberProfile,
} from '@/lib/memberProfile';

describe('member profiles', () => {
  beforeEach(() => window.localStorage.clear());

  it('derives a readable name without exposing the full email address', () => {
    expect(deriveMemberName('aziz.motomoto@example.com')).toBe('Aziz Motomoto');
    expect(deriveMemberName('+254700000000')).toBe('Baraza member');
  });

  it('normalizes profile text and links', () => {
    expect(normalizeMemberProfile({
      displayName: '  Aziz Motomoto  ',
      bio: '  Community builder  ',
      websiteUrl: 'buildadao.io',
      xUrl: 'javascript:alert(1)',
    }, 'member@example.com')).toMatchObject({
      displayName: 'Aziz Motomoto',
      bio: 'Community builder',
      websiteUrl: 'https://buildadao.io/',
      xUrl: '',
    });
  });

  it('keeps profiles scoped to the signed-in account', () => {
    writeMemberProfile('account-a', {
      ...createMemberProfile(),
      displayName: 'Amina Njeri',
    });

    expect(readMemberProfile('account-a').displayName).toBe('Amina Njeri');
    expect(readMemberProfile('account-b', 'samuel@example.com').displayName).toBe('Samuel');
  });
});
