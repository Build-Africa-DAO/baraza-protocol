import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MemberDirectory from '@/components/community/MemberDirectory';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

let members: Array<Record<string, unknown>> = [];
vi.mock('@/hooks/useBarazaData', () => ({
  useMembers: () => members,
}));
vi.mock('@/lib/duesStreak', () => ({
  fetchDuesStreakBatch: async () => ({ w1: { consecutiveMonthsPaid: 3, lastPaidAt: null, perCommunity: {} } }),
}));

function member(over: Partial<Record<string, unknown>>) {
  return {
    id: 'm1',
    communityId: '1',
    name: 'Amani Kariuki',
    walletKey: 'w1',
    joinedAt: now - 400 * DAY,
    role: 'member',
    status: 'active',
    totalContributed: 6000,
    contributionCount: 12,
    lastContributionAt: now - 5 * DAY,
    contributions: [{ id: 'c1', amount: 500, type: 'monthly', timestamp: now - 5 * DAY, note: '' }],
    votesCount: 4,
    proposalsCount: 0,
    ...over,
  };
}

afterEach(cleanup);

describe('MemberDirectory', () => {
  it('shows an honest empty state when no members are listed', () => {
    members = [];
    render(<MemberDirectory communityId="1" />);
    expect(screen.getByText('No Members Listed Yet')).toBeInTheDocument();
  });

  it('gives members names and roles, but no dues standing, no aggregates and no CSV', () => {
    members = [member({}), member({ id: 'm2', name: 'Wanjiku Mwangi', walletKey: 'w2', role: 'admin' })];
    render(<MemberDirectory communityId="1" currency="KES" />);
    expect(screen.getByText('Amani Kariuki')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Officer' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Active' })).toBeNull();
    expect(screen.queryByText(/Total Contributed/)).toBeNull();
    expect(screen.queryByRole('button', { name: /CSV/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Overdue' })).toBeNull();
  });

  it('gives officers the Overdue filter and dues chips', () => {
    members = [member({}), member({ id: 'm3', name: 'Late Payer', walletKey: 'w3', lastContributionAt: now - 90 * DAY })];
    render(<MemberDirectory communityId="1" currency="KES" isOfficer />);
    expect(screen.getByRole('status', { name: 'Overdue' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Overdue/ }));
    expect(screen.getByText('Late Payer')).toBeInTheDocument();
    expect(screen.queryByText('Amani Kariuki')).toBeNull();
  });

  it('expands a row to show recent contributions in the group currency', () => {
    members = [member({})];
    render(<MemberDirectory communityId="1" currency="KES" />);
    fireEvent.click(screen.getByRole('button', { name: /Amani Kariuki/ }));
    expect(screen.getByText('Monthly dues')).toBeInTheDocument();
    expect(screen.getByText('KES 500')).toBeInTheDocument();
  });
});
