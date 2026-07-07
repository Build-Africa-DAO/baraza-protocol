import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/Layout';

vi.mock('@/components/Header', () => ({
  default: () => <header>Header</header>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock('@/components/MobileBottomNav', () => ({
  default: () => <nav aria-label="Mobile navigation">Bottom nav</nav>,
}));

vi.mock('@/components/BackendStatus', () => ({
  default: () => <div>Backend status</div>,
}));

function renderLayout(path: string, children: ReactNode = <div>Content</div>) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout>{children}</Layout>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('Layout mobile navigation', () => {
  it('hides the fixed mobile nav during join flows', () => {
    renderLayout('/join/1');

    expect(screen.queryByRole('navigation', { name: /Mobile navigation/i })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).not.toHaveClass('pb-24');
  });

  it('keeps the fixed mobile nav on general routes', () => {
    renderLayout('/communities');

    expect(screen.getByRole('navigation', { name: /Mobile navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('pb-24');
  });
});
