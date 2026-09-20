import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RailHealthLine } from '@/components/app/RailHealthLine';

afterEach(() => vi.unstubAllGlobals());

describe('RailHealthLine', () => {
  it('reads the readiness probe and never claims a prompt time', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ status: 'degraded', timestamp: '', cached: false, components: { database: { tier: 'hard', status: 'healthy', latency_ms: 4 }, stellar_horizon: { tier: 'soft', status: 'degraded', latency_ms: 900 } } }),
      ),
    );
    render(<RailHealthLine />);
    await waitFor(() => expect(screen.getByTestId('rail-health')).toHaveTextContent(/latency is elevated/));
    expect(screen.getByTestId('rail-health').textContent).not.toMatch(/\d+s/);
  });

  it('says not checked when the probe cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<RailHealthLine />);
    await waitFor(() => expect(screen.getByTestId('rail-health')).toHaveTextContent(/not checked/));
  });
});
