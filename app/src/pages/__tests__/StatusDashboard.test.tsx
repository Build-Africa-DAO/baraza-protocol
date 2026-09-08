import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StatusDashboard from '@/pages/StatusDashboard';

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('StatusDashboard', () => {
  it('renders operational rails from GET /api/health/ready', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        status: 'ready',
        timestamp: '2026-09-08T06:00:00.000Z',
        cached: true,
        components: {
          database: { tier: 'hard', status: 'healthy', latency_ms: 8 },
          stellar_horizon: { tier: 'soft', status: 'healthy', latency_ms: 40 },
          redis: { tier: 'soft', status: 'healthy', latency_ms: 2 },
        },
      }),
    }));

    render(
      <MemoryRouter>
        <StatusDashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText('All hard systems operational')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL database')).toBeInTheDocument();
    expect(screen.getByText('Stellar Horizon RPC')).toBeInTheDocument();
    expect(screen.getByText('Kotani Pay / Minisend')).toBeInTheDocument();
  });
});
