import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CreateCommunity from '@/pages/CreateCommunity';

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/akili/AskAkili', () => ({ AskAkili: () => null }));
vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    authenticated: true,
    ready: true,
    configured: true,
    accountId: 'acct-1',
    displayName: 'Amani K.',
    country: { code: 'KE', name: 'Kenya', currency: 'KES' },
    getAccessToken: async () => null,
  }),
}));

const createCommunityRecord = vi.fn(async (input: { name: string }) => ({ id: 'new-1', name: input.name }));
vi.mock('@/lib/communities', () => ({
  createCommunityRecord: (input: { name: string }) => createCommunityRecord(input),
}));

afterEach(() => {
  cleanup();
  createCommunityRecord.mockClear();
});

function renderCreate(path = '/create') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/create" element={<CreateCommunity />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CreateCommunity wizard', () => {
  it('needs one kind of group before continuing, and offers five kinds', () => {
    renderCreate();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What Kind of Group?');
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    const next = screen.getByRole('button', { name: 'Continue' });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /Chama/ }));
    expect(next).toBeEnabled();
  });

  it('preselects a legacy ?type= and walks to an honest no-fee open step', async () => {
    renderCreate('/create?type=chama');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Name Your Group');

    fireEvent.change(screen.getByLabelText('Group Name'), { target: { value: 'Milele Chama' } });
    fireEvent.change(screen.getByLabelText('What This Group Does'), { target: { value: 'Monthly savings for school fees.' } });
    fireEvent.change(screen.getByLabelText('What You Collect Each Month'), { target: { value: '500' } });
    expect(screen.getAllByText(/More than half of members must vote and two thirds of those who vote must agree/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Open This Group');
    expect(screen.getByText('No launch fee in this environment')).toBeInTheDocument();
    expect(screen.queryByText(/6,500/)).toBeNull();
    expect(screen.queryByText(/SWIFT|WhatsApp|Privy|Solana|Paybill/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));
    await waitFor(() => expect(screen.getByText('Your Group Is Open')).toBeInTheDocument());
    expect(createCommunityRecord).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Milele Chama', type: 'savings', membershipFee: 500, currency: 'KES', feeType: 'recurring_monthly' }),
    );
    expect(screen.getByRole('link', { name: 'Invite People' })).toHaveAttribute('href', '/dashboard/new-1/people');
  });

  it('lets a group be free to join', () => {
    renderCreate('/create?type=welfare');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: /Free to Join/ }));
    expect(screen.queryByLabelText('What You Collect Each Month')).toBeNull();
    expect(screen.getByText('Free to join.')).toBeInTheDocument();
  });

  it('offers a one-time fee and relabels the amount', () => {
    renderCreate('/create?type=welfare');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: /One-Time Fee/ }));
    expect(screen.getByLabelText('One-Time Fee to Join')).toBeInTheDocument();
    expect(screen.getByText(/pay once to join/)).toBeInTheDocument();
  });

  it('prefills the name from ?name= so Browse can hand off a search', () => {
    renderCreate('/create?type=welfare&name=Umoja%20Chama');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Group Name')).toHaveValue('Umoja Chama');
  });

  it('shows minimum character count next to description helper when user starts typing', () => {
    renderCreate('/create?type=chama');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('One or two sentences members will see when they join.')).toBeInTheDocument();
    expect(screen.queryByText(/At least 10 characters/)).toBeNull();

    fireEvent.change(screen.getByLabelText('What This Group Does'), { target: { value: 'kjsfsfs' } });
    expect(
      screen.getByText('One or two sentences members will see when they join. At least 10 characters.'),
    ).toBeInTheDocument();
  });
});
