import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ParamRedirect } from '@/components/app/RouteRedirects';
import LegacyTabRedirect from '@/components/app/LegacyTabRedirect';

/**
 * §13.25. Every one of these URLs is in somebody's SMS, email or browser
 * history. A 404 here is a member who cannot pay or vote.
 */

function Probe() {
  const location = useLocation();
  return <div data-testid="landed">{`${location.pathname}${location.search}${location.hash}`}</div>;
}

function renderAt(entry: string, routes: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        {routes}
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('legacy group URLs', () => {
  const cases: { from: string; path: string; build: (p: Record<string, string | undefined>, search: string) => string; expected: string }[] = [
    {
      from: '/dashboard/7/treasury',
      path: '/dashboard/:id/treasury',
      build: (p) => `/dashboard/${p.id}/money`,
      expected: '/dashboard/7/money',
    },
    {
      from: '/dashboard/7/disbursements',
      path: '/dashboard/:id/disbursements',
      build: (p) => `/dashboard/${p.id}/money?send=1`,
      expected: '/dashboard/7/money?send=1',
    },
    {
      from: '/dashboard/7/compliance',
      path: '/dashboard/:id/compliance',
      build: (p) => `/dashboard/${p.id}/settings#license`,
      expected: '/dashboard/7/settings#license',
    },
    {
      from: '/dashboard/7/decisions/create',
      path: '/dashboard/:id/decisions/create',
      build: (p) => `/dashboard/${p.id}/votes/new`,
      expected: '/dashboard/7/votes/new',
    },
    {
      from: '/dashboard/7/decisions/d42',
      path: '/dashboard/:id/decisions/:decisionId',
      build: (p) => `/dashboard/${p.id}/votes/${p.decisionId}`,
      expected: '/dashboard/7/votes/d42',
    },
    {
      from: '/dao/7/proposals',
      path: '/dao/:id/proposals',
      build: (p) => `/dashboard/${p.id}/votes`,
      expected: '/dashboard/7/votes',
    },
    {
      from: '/dao/7/vote',
      path: '/dao/:id/vote',
      build: (p) => `/dashboard/${p.id}/votes`,
      expected: '/dashboard/7/votes',
    },
  ];

  for (const testCase of cases) {
    it(`sends ${testCase.from} to ${testCase.expected}`, () => {
      renderAt(
        testCase.from,
        <Route path={testCase.path} element={<ParamRedirect build={testCase.build} />} />,
      );
      expect(screen.getByTestId('landed')).toHaveTextContent(testCase.expected);
    });
  }

  it('carries the query string through the /dao alias', () => {
    renderAt(
      '/dao/7?tab=members',
      <Route path="/dao/:id" element={<ParamRedirect build={(p, search) => `/dashboard/${p.id}${search}`} />} />,
    );
    expect(screen.getByTestId('landed')).toHaveTextContent('/dashboard/7?tab=members');
  });
});

describe('legacy ?tab= values', () => {
  function renderTab(entry: string) {
    return render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/dashboard/:id"
            element={<LegacyTabRedirect><div data-testid="landed">group home</div></LegacyTabRedirect>}
          />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  const moved: [string, string][] = [
    ['governance', '/dashboard/7/votes'],
    ['members', '/dashboard/7/people'],
    ['settings', '/dashboard/7/settings'],
    ['wallet', '/account'],
    ['bounties', '/dashboard/7/more?tab=bounties'],
    ['gallery', '/dashboard/7/more'],
    ['roadmap', '/dashboard/7/more?tab=roadmap'],
    ['activity', '/dashboard/7/more?tab=activity'],
    ['roles', '/dashboard/7/more?tab=roles'],
    ['suggestions', '/dashboard/7/more?tab=suggestions'],
    ['leaderboard', '/dashboard/7/more?tab=leaderboard'],
    ['combined', '/dashboard/7/more?tab=combined'],
  ];

  for (const [tab, expected] of moved) {
    it(`sends ?tab=${tab} to ${expected}`, () => {
      renderTab(`/dashboard/7?tab=${tab}`);
      expect(screen.getByTestId('landed')).toHaveTextContent(expected);
    });
  }

  it('renders the group home for overview and for no tab at all', () => {
    renderTab('/dashboard/7?tab=overview');
    expect(screen.getByTestId('landed')).toHaveTextContent('group home');
    cleanup();

    renderTab('/dashboard/7');
    expect(screen.getByTestId('landed')).toHaveTextContent('group home');
  });

  it('ignores an unknown tab rather than redirecting into nowhere', () => {
    renderTab('/dashboard/7?tab=not-a-real-tab');
    expect(screen.getByTestId('landed')).toHaveTextContent('group home');
  });
});

describe('top-level renames', () => {
  it('keeps the documented §13.25 table in sync with the router', async () => {
    const { LEGACY_ROUTES } = await import('@/lib/legacyRoutes');
    expect(LEGACY_ROUTES.map((row) => row.from)).toEqual([
      '/communities',
      '/profile',
      '/evaluate',
      '/create/purpose',
      '/proposals',
      '/vote',
    ]);
  });
});

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));
