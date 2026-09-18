import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '@/components/app/AppShell';

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
}));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    authenticated: true,
    accountId: 'user-1',
    getAccessToken: async () => 'token',
  }),
}));

const mockMemberships = vi.fn();
vi.mock('@/hooks/useMyMemberships', () => ({
  useMyMemberships: () => mockMemberships(),
}));

const mockGroupMembership = vi.fn();
vi.mock('@/hooks/useGroupMembership', () => ({
  useGroupMembership: () => mockGroupMembership(),
}));

vi.mock('@/components/app/TopBarMenus', () => ({
  ThemeToggle: () => null,
  AccountMenu: () => null,
  LogoutMenu: () => null,
}));

vi.mock('@/components/BackendStatus', () => ({ default: () => null }));
vi.mock('@/components/OfflineBanner', () => ({ default: () => null }));

describe('AppShell WorkspaceNav collapsing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGroupMembership.mockReturnValue({ isMember: false, isOfficer: false, isLoading: false });
  });

  it('shows Workspace nav expanded when user has not joined any group', () => {
    mockMemberships.mockReturnValue({ active: [], memberships: [], source: 'api', isLoading: false });

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    );

    // In expanded mode, "Your Groups", "Browse", "All Groups", "Start a Group" etc. are visible
    expect(screen.getAllByText('Your Groups').length).toBeGreaterThan(0);
    expect(screen.getAllByText('All Groups').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Start a Group').length).toBeGreaterThan(0);
  });

  it('collapses tabs when user has joined a group and allows toggling each tab', () => {
    mockMemberships.mockReturnValue({
      active: [{ community: { id: 'c-1', name: 'My Chama', image: 'MC' } }],
      memberships: [{ community: { id: 'c-1', name: 'My Chama', image: 'MC' }, record: { status: 'active' } }],
      source: 'api',
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/c-1']}>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    );

    // Each tab title is visible
    expect(screen.getAllByText('My Groups').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Browse').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Start a Group').length).toBeGreaterThan(0);

    // When collapsed by default, the sub-pages should not be visible
    expect(screen.queryByText('Join With an Invite')).toBeNull();
    expect(screen.queryByText('All Groups')).toBeNull();
    expect(screen.queryByText('How It Works')).toBeNull();

    // The individual toggle button for Browse should be present
    const toggleBrowseBtn = screen.getByRole('button', { name: 'Toggle Browse' });
    expect(toggleBrowseBtn).toBeInTheDocument();

    // Click Browse toggle to expand it
    fireEvent.click(toggleBrowseBtn);

    expect(screen.getByText('All Groups')).toBeInTheDocument();
    expect(screen.getByText('Chamas')).toBeInTheDocument();
    expect(screen.getByText('SACCOs')).toBeInTheDocument();
    // Other tabs remain collapsed
    expect(screen.queryByText('Join With an Invite')).toBeNull();
    expect(screen.queryByText('How It Works')).toBeNull();

    // Toggle Start a Group as well
    const toggleStartBtn = screen.getByRole('button', { name: 'Toggle Start a Group' });
    fireEvent.click(toggleStartBtn);
    expect(screen.getAllByText('New Group').length).toBeGreaterThan(0);
    expect(screen.getByText('How It Works')).toBeInTheDocument();

    // Collapse Browse again
    fireEvent.click(toggleBrowseBtn);
    expect(screen.queryByText('All Groups')).toBeNull();
    // Start a Group remains open
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('renders collapse/expand toggle button in the sidebar header and toggles collapse state', () => {
    mockMemberships.mockReturnValue({ active: [], memberships: [], source: 'api', isLoading: false });

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    );

    // Toggle button should be present in the sidebar with aria-label "Collapse sidebar"
    const collapseBtn = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(collapseBtn).toBeInTheDocument();

    // Click to collapse the desktop sidebar
    fireEvent.click(collapseBtn);

    // Should now show "Expand sidebar"
    const expandBtn = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expandBtn).toBeInTheDocument();

    // Click to expand again
    fireEvent.click(expandBtn);
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });
});
