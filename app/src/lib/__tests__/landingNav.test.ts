import { describe, expect, it } from 'vitest';
import { isLandingNavActive, pickActiveLandingSection } from '@/lib/landingNav';

describe('isLandingNavActive', () => {
  it('uses the scroll spy id on the homepage', () => {
    expect(isLandingNavActive('/', '#faq', 'features', 'features')).toBe(true);
    expect(isLandingNavActive('/', '#faq', 'features', 'faq')).toBe(false);
  });

  it('falls back to the hash when nothing is in the spy band yet', () => {
    expect(isLandingNavActive('/', '#how-it-works', null, 'how-it-works')).toBe(true);
    expect(isLandingNavActive('/', '', null, 'features')).toBe(false);
  });

  it('keeps Features active through the group-runs stats band', () => {
    expect(isLandingNavActive('/', '#who-its-for', 'who-its-for', 'features')).toBe(true);
    expect(isLandingNavActive('/', '#who-its-for', null, 'features')).toBe(true);
    expect(isLandingNavActive('/', '#who-its-for', 'who-its-for', 'faq')).toBe(false);
  });

  it('keeps Contact active through the closing CTA and footer', () => {
    expect(isLandingNavActive('/', '#contact', 'contact', 'contact')).toBe(true);
    expect(isLandingNavActive('/', '#contact', 'closing-cta', 'contact')).toBe(true);
    expect(isLandingNavActive('/', '#contact', 'site-footer', 'contact')).toBe(true);
    expect(isLandingNavActive('/', '#contact', 'site-footer', 'faq')).toBe(false);
  });

  it('treats the top of the landing page as Home when there is no hash', () => {
    expect(isLandingNavActive('/', '', null, 'home')).toBe(true);
    expect(isLandingNavActive('/', '', null, 'faq')).toBe(false);
  });

  it('stays inactive off the landing page', () => {
    expect(isLandingNavActive('/communities', '', 'home', 'home')).toBe(false);
  });
});

describe('pickActiveLandingSection', () => {
  it('picks the last section that has crossed the spy line', () => {
    const id = pickActiveLandingSection(
      [
        { id: 'features', top: 40, height: 400 },
        { id: 'groups', top: 200, height: 400 },
      ],
      800,
    );
    expect(id).toBe('groups');
  });

  it('stays on Contact once the form, closing CTA, or footer has crossed', () => {
    expect(
      pickActiveLandingSection(
        [
          { id: 'faq', top: -120, height: 500 },
          { id: 'contact', top: 80, height: 900 },
          { id: 'closing-cta', top: 980, height: 500 },
        ],
        800,
      ),
    ).toBe('contact');

    expect(
      pickActiveLandingSection(
        [
          { id: 'contact', top: -200, height: 900 },
          { id: 'closing-cta', top: 40, height: 500 },
          { id: 'site-footer', top: 540, height: 700 },
        ],
        800,
      ),
    ).toBe('closing-cta');
  });

  it('returns null when every section is below the fold', () => {
    expect(pickActiveLandingSection([{ id: 'contact', top: 900, height: 400 }], 800)).toBeNull();
  });
});
