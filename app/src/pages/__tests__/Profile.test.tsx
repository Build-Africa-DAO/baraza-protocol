import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Profile from '@/pages/Profile';

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    ready: true,
    authenticated: true,
    accountId: 'user-123',
    displayName: 'eugenegabriel.ke@gmail.com',
    country: { code: 'KE', name: 'Kenya', currency: 'KES' },
    getAccessToken: async () => 'test-token',
    logout: async () => {},
    setCountry: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMyMemberships', () => ({
  useMyMemberships: () => ({
    active: [],
    memberships: [],
    source: 'none',
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/lib/userProfile', () => ({
  DEFAULT_NOTIFICATIONS: { sms: false, whatsapp: false, email: false, push: false },
  PROFILE_LOCALES: [{ id: 'en', label: 'English' }],
  countryForProfilePatch: () => 'KE',
  fetchUserProfile: vi.fn(async () => null),
  patchUserProfile: vi.fn(async () => ({ ok: true })),
  readLocalLocale: () => 'en',
  writeLocalLocale: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Profile (Account page)', () => {
  afterEach(() => {
    cleanup();
  });

  function renderProfile() {
    return render(
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders Account title with identity strip in header, centered Save, centered Your Groups, and no Log Out button', () => {
    renderProfile();

    // 1. Account header and identity strip
    const accountHeading = screen.getByRole('heading', { name: /^account$/i });
    expect(accountHeading).toBeInTheDocument();

    const identityName = screen.getByText('eugenegabriel.ke@gmail.com');
    expect(identityName).toBeInTheDocument();
    expect(screen.getByText('Signed In')).toBeInTheDocument();

    // The header container wraps both Account and the IdentityStrip
    const header = accountHeading.closest('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'sm:justify-between');

    // 2. Centered Save button
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeInTheDocument();
    const saveContainer = saveBtn.closest('div');
    expect(saveContainer).toHaveClass('justify-center');

    // 3. Centered Your Groups title
    const groupsHeading = screen.getByRole('heading', { name: /your groups/i });
    expect(groupsHeading).toBeInTheDocument();
    expect(groupsHeading).toHaveClass('text-center');

    // 4. Log Out is not on this page; it lives in the top bar account menu.
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
  });
});
