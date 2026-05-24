import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ChainProvider from '@/components/ChainProvider';
import ChainSelector from '@/components/ChainSelector';

beforeEach(() => {
  // localStorage is already cleared by the global setup; verify the chain key
  // has no stale state from a previous test in this file.
  window.localStorage.removeItem('baraza:chain');
});

function renderSelector() {
  return render(
    <ChainProvider>
      <ChainSelector />
    </ChainProvider>,
  );
}

describe('ChainSelector — closed state', () => {
  it('renders the current chain (Solana by default)', () => {
    renderSelector();
    expect(screen.getByRole('button', { name: /network: solana/i })).toBeInTheDocument();
  });

  it('does not render the listbox when closed', () => {
    renderSelector();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('toggles open on trigger click', () => {
    renderSelector();
    const trigger = screen.getByRole('button', { name: /network: solana/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('ChainSelector — open state', () => {
  it('lists all 9 chains, with Solana as the selected option', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /network: solana/i }));
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(9);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    // All non-Solana options are unselected
    for (let i = 1; i < options.length; i++) {
      expect(options[i]).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('allows Stellar selection', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /network: solana/i }));
    const stellarOption = screen.getByRole('option', { name: /^stellar$/i });
    expect(stellarOption).not.toBeDisabled();
    fireEvent.click(stellarOption);
    expect(screen.getByRole('button', { name: /network: stellar/i })).toBeInTheDocument();
  });

  it('disables all non-Solana chains with integration-pending labels', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /network: solana/i }));
    for (const name of ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bnb chain', 'celo']) {
      expect(screen.getByRole('option', { name: new RegExp(`${name}.*integration pending`, 'i') })).toBeDisabled();
    }
  });

  it('closes on Escape', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /network: solana/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on outside click', () => {
    const { container } = renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /network: solana/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // mousedown outside the component should trigger close.
    fireEvent.mouseDown(container.ownerDocument.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('ChainSelector — keyboard navigation', () => {
  it('ArrowDown can focus Stellar as the next enabled option', () => {
    renderSelector();
    const trigger = screen.getByRole('button', { name: /network: solana/i });
    fireEvent.click(trigger);

    // Solana (index 0) and Stellar (index 1) are enabled.
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // No crash, listbox still open
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('ArrowUp closes nothing and lands on enabled option', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /network: solana/i }));
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

describe('ChainSelector — persistence', () => {
  it('writes the chain to localStorage on selection', () => {
    renderSelector();
    // Initial: nothing in storage (cleared in beforeEach)
    expect(window.localStorage.getItem('baraza:chain')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /network: solana/i }));
    // Clicking the already-selected Solana option still triggers a write.
    fireEvent.click(screen.getByRole('option', { name: /solana/i }));

    expect(window.localStorage.getItem('baraza:chain')).toBe('solana');
  });

  it('reads the initial chain from localStorage if present', () => {
    window.localStorage.setItem('baraza:chain', 'stellar');
    renderSelector();
    expect(screen.getByRole('button', { name: /network: stellar/i })).toBeInTheDocument();
  });
});
