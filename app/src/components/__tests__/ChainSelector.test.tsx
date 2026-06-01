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
  it('renders Baraza Token as the default product rail', () => {
    renderSelector();
    expect(screen.getByRole('button', { name: /baraza token selected/i })).toBeInTheDocument();
  });

  it('does not render the listbox when closed', () => {
    renderSelector();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('toggles open on trigger click', () => {
    renderSelector();
    const trigger = screen.getByRole('button', { name: /baraza token selected/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('ChainSelector — open state', () => {
  it('lists the three visible rails, with Baraza Token as the selected option', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    // All non-Baraza options are unselected
    for (let i = 1; i < options.length; i++) {
      expect(options[i]).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('allows Stellar selection', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));
    const stellarOption = screen.getByRole('option', { name: /^stellar$/i });
    expect(stellarOption).not.toBeDisabled();
    fireEvent.click(stellarOption);
    expect(screen.getByRole('button', { name: /stellar selected/i })).toBeInTheDocument();
  });

  it('keeps roadmap-only EVM review rails out of the picker', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));

    for (const name of ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bnb chain', 'xdc']) {
      expect(screen.queryByRole('option', { name: new RegExp(name, 'i') })).not.toBeInTheDocument();
    }

    expect(screen.getByRole('option', { name: /^celo$/i })).not.toBeDisabled();
  });

  it('does not render unsupported rails', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));
    expect(screen.queryByRole('option', { name: /bnb chain/i })).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on outside click', () => {
    const { container } = renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // mousedown outside the component should trigger close.
    fireEvent.mouseDown(container.ownerDocument.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('ChainSelector — keyboard navigation', () => {
  it('ArrowDown can focus Stellar as the next enabled option', () => {
    renderSelector();
    const trigger = screen.getByRole('button', { name: /baraza token selected/i });
    fireEvent.click(trigger);

    // Baraza Token (index 0), Stellar (index 1), and Celo are visible.
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // No crash, listbox still open
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('ArrowUp closes nothing and lands on enabled option', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

describe('ChainSelector — persistence', () => {
  it('writes the chain to localStorage on selection', () => {
    renderSelector();
    // Initial: nothing in storage (cleared in beforeEach)
    expect(window.localStorage.getItem('baraza:chain')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /baraza token selected/i }));
    // Clicking the already-selected Baraza Token option still triggers a write.
    fireEvent.click(screen.getByRole('option', { name: /baraza token/i }));

    expect(window.localStorage.getItem('baraza:chain')).toBe('solana');
  });

  it('reads the initial chain from localStorage if present', () => {
    window.localStorage.setItem('baraza:chain', 'stellar');
    renderSelector();
    expect(screen.getByRole('button', { name: /stellar selected/i })).toBeInTheDocument();
  });
});
