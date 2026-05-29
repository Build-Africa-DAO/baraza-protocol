import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DecisionCard from '@/components/DecisionCard';
import type { ProposalLifecycleStage } from '@/lib/constants';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockRequireWallet = vi.fn(async <T,>(fn: () => Promise<T>) => fn());
const mockCastVote = vi.fn();

vi.mock('@/hooks/useWalletGuard', () => ({
  useWalletGuard: () => ({
    requireWallet: mockRequireWallet,
    isReady: true,
    address: 'MockWallet11111111111111111111111111111111',
  }),
}));

vi.mock('@/hooks/useBarazaContract', () => ({
  useBarazaContract: () => ({
    castVote: mockCastVote,
    isPending: false,
  }),
}));

// framer-motion's `motion.div` works in jsdom out of the box; no mock needed.

beforeEach(() => {
  mockRequireWallet.mockClear();
  mockCastVote.mockClear();
  // Default: cast succeeds
  mockCastVote.mockResolvedValue(true);
});

function defaults(over?: Partial<React.ComponentProps<typeof DecisionCard>>) {
  return {
    id: 'd1',
    communityId: 'c1',
    title: 'Buy a community blender',
    description: 'A proposal for collective smoothies.',
    fundingAmount: 5000,
    proposedBy: 'Alice',
    votesFor: 8,
    votesAgainst: 4,
    totalMembers: 20,
    status: 'active',
    createdAt: '2026-05-01T00:00:00Z',
    endsAt: '2099-01-01T00:00:00Z',
    ...over,
  };
}

// ─── Lifecycle pill ──────────────────────────────────────────────────────────

describe('DecisionCard — lifecycle pill', () => {
  it('renders "Voting" pill when stage is active', () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'active' })} />);
    expect(screen.getByLabelText(/stage: voting/i)).toBeInTheDocument();
  });

  it('renders "Passed" pill when stage is succeeded', () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'succeeded' })} />);
    expect(screen.getByLabelText(/stage: passed/i)).toBeInTheDocument();
  });

  it('renders "Defeated" pill when stage is defeated', () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'defeated' })} />);
    expect(screen.getByLabelText(/stage: defeated/i)).toBeInTheDocument();
  });

  it('renders "Executed" pill when stage is executed (terminal positive)', () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'executed' })} />);
    expect(screen.getByLabelText(/stage: executed/i)).toBeInTheDocument();
  });

  it('renders "Vetoed" pill when stage is vetoed', () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'vetoed' })} />);
    expect(screen.getByLabelText(/stage: vetoed/i)).toBeInTheDocument();
  });

  it('infers stage from status when lifecycleStage is absent: completed -> Executed', () => {
    render(<DecisionCard {...defaults({ status: 'completed' })} />);
    expect(screen.getByLabelText(/stage: executed/i)).toBeInTheDocument();
  });

  it('infers stage from status when lifecycleStage is absent: failed -> Defeated', () => {
    render(<DecisionCard {...defaults({ status: 'failed' })} />);
    expect(screen.getByLabelText(/stage: defeated/i)).toBeInTheDocument();
  });
});

// ─── Vote-button gating ──────────────────────────────────────────────────────

describe('DecisionCard — vote button visibility', () => {
  it('shows Support and Object buttons when stage is votable (active)', () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'active' })} />);
    expect(screen.getByRole('button', { name: /support/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /object/i })).toBeInTheDocument();
  });

  const NON_VOTABLE: ProposalLifecycleStage[] = [
    'pending',
    'defeated',
    'succeeded',
    'queued',
    'executed',
    'expired',
    'canceled',
    'vetoed',
  ];

  for (const stage of NON_VOTABLE) {
    it(`hides vote buttons when stage is ${stage}`, () => {
      render(<DecisionCard {...defaults({ lifecycleStage: stage })} />);
      expect(screen.queryByRole('button', { name: /support/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /object/i })).not.toBeInTheDocument();
    });
  }
});

// ─── Voting interaction ──────────────────────────────────────────────────────

describe('DecisionCard — voting', () => {
  it('calls castVote with vote=true when Support clicked', async () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'active' })} />);
    fireEvent.click(screen.getByRole('button', { name: /support/i }));
    await waitFor(() => expect(mockCastVote).toHaveBeenCalledTimes(1));
    expect(mockCastVote).toHaveBeenCalledWith('d1', 'c1', 'yes');
  });

  it('calls castVote with vote=false when Object clicked', async () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'active' })} />);
    fireEvent.click(screen.getByRole('button', { name: /object/i }));
    await waitFor(() => expect(mockCastVote).toHaveBeenCalledTimes(1));
    expect(mockCastVote).toHaveBeenCalledWith('d1', 'c1', 'no');
  });

  it('prevents double-voting (second click is a no-op)', async () => {
    render(<DecisionCard {...defaults({ lifecycleStage: 'active' })} />);
    fireEvent.click(screen.getByRole('button', { name: /support/i }));
    await waitFor(() => expect(mockCastVote).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /support/i }));
    fireEvent.click(screen.getByRole('button', { name: /object/i }));
    expect(mockCastVote).toHaveBeenCalledTimes(1);
  });

  it('rolls back optimistic update when castVote returns false', async () => {
    mockCastVote.mockResolvedValue(false);
    render(<DecisionCard {...defaults({ lifecycleStage: 'active' })} />);
    fireEvent.click(screen.getByRole('button', { name: /support/i }));
    await waitFor(() => expect(mockCastVote).toHaveBeenCalledTimes(1));
    // After rollback, support tally should reset to original 8.
    // The "8 support" text confirms the bar didn't optimistically tick up to 9.
    expect(screen.getByText(/8 support/i)).toBeInTheDocument();
  });
});
