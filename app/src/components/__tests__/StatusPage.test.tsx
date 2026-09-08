import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import StatusPage from '@/components/StatusPage';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { Button } from '@/components/ui/button';
import { STATUS_COPY, type StatusKind } from '@/lib/statusPages';
import { toTitleCase } from '@/lib/utils';

vi.mock('@/lib/seo', () => ({
  useSeo: vi.fn(),
}));

function renderPage(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

afterEach(cleanup);

const KINDS = Object.keys(STATUS_COPY) as StatusKind[];

describe('StatusPage', () => {
  it.each(KINDS)('renders %s with a title-cased heading and actions', (kind) => {
    renderPage(<StatusPage kind={kind} onRetry={() => undefined} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      toTitleCase(STATUS_COPY[kind].title),
    );
    expect(screen.queryAllByRole('link').length + screen.queryAllByRole('button').length).toBeGreaterThan(0);
  });

  it('keeps 404 button labels in title case', () => {
    renderPage(<StatusPage kind="not-found" />);
    expect(screen.getByRole('link', { name: 'Go Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Communities' })).toBeInTheDocument();
  });
});

describe('Button title case', () => {
  it('title-cases string labels', () => {
    render(<Button>browse communities</Button>);
    expect(screen.getByRole('button', { name: 'Browse Communities' })).toBeInTheDocument();
  });
});

describe('AppErrorBoundary', () => {
  it('shows the 500 status page when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function Boom(): never {
      throw new Error('boom');
    }

    renderPage(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /Something Went Wrong/i })).toBeInTheDocument();
    spy.mockRestore();
  });
});
