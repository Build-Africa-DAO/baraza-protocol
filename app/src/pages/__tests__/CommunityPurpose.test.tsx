import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import CommunityPurpose from '@/pages/CommunityPurpose';

vi.mock('@/lib/seo', () => ({
  useSeo: vi.fn(),
}));

function SetupDestination() {
  const location = useLocation();
  return <div data-testid="setup-location">{`${location.pathname}${location.search}`}</div>;
}

function renderPurpose() {
  return render(
    <MemoryRouter initialEntries={['/create/purpose']}>
      <Routes>
        <Route path="/create/purpose" element={<CommunityPurpose />} />
        <Route path="/create" element={<SetupDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('CommunityPurpose', () => {
  it('requires a selection and carries the selected purpose into setup', () => {
    renderPurpose();

    const continueButton = screen.getByRole('button', { name: 'Continue to setup' });
    expect(continueButton).toBeDisabled();

    const businessOption = screen.getByRole('button', { name: /Business ventures/ });
    fireEvent.click(businessOption);

    expect(businessOption).toHaveAttribute('aria-pressed', 'true');
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.getByTestId('setup-location')).toHaveTextContent(
      '/create?type=investment&purposes=business-ventures',
    );
  });

  it('keeps the questionnaire as the only path into setup', () => {
    renderPurpose();

    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });
});
