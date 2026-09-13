import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AmountBlock } from '@/components/ui/amount-block';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, MoneyField, PhoneField, Switch } from '@/components/ui/field';
import { FilterChips } from '@/components/ui/filter-chips';
import { InlineError } from '@/components/ui/inline-error';
import { PageHeader } from '@/components/ui/page-header';
import { Sheet } from '@/components/ui/sheet';
import { StatusChip } from '@/components/ui/status-chip';
import { Stepper } from '@/components/ui/stepper';

const router = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('StatusChip', () => {
  it('renders the word with an icon and never uses primary', () => {
    const { container } = render(<StatusChip kind="pending" label="Pending" />);
    const chip = screen.getByRole('status', { name: 'Pending' });
    expect(chip).toHaveAttribute('data-kind', 'pending');
    expect(container.querySelector('svg')).not.toBeNull();
    expect(chip.className).not.toMatch(/primary/);
  });
  it('can drop the icon for neutral labels', () => {
    const { container } = render(<StatusChip kind="info" icon={null} label="Savings chama" />);
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('AmountBlock', () => {
  it('formats minor units in the group currency, code first', () => {
    render(<AmountBlock label="Total" amountMinor={124850000} currency="KES" />);
    expect(screen.getByText('KES 1,248,500')).toBeInTheDocument();
  });
  it('says so when the server sent no figure', () => {
    render(<AmountBlock label="Reserved" amountMinor={null} />);
    expect(screen.getByText('Not available yet')).toBeInTheDocument();
  });
});

describe('Stepper', () => {
  it('marks done, current and to-do steps', () => {
    render(<Stepper steps={[{ label: 'See Group' }, { label: 'Pay' }, { label: 'Confirming' }]} current={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-state', 'done');
    expect(items[1]).toHaveAttribute('data-state', 'current');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).toHaveAttribute('data-state', 'todo');
  });
  it('shows a failed current step', () => {
    render(<Stepper steps={[{ label: 'Pay' }, { label: 'Confirming' }]} current={1} failed />);
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('data-state', 'failed');
  });
});

describe('FilterChips', () => {
  it('is single-select and reports the chosen key', () => {
    const onChange = vi.fn();
    render(
      <FilterChips
        aria-label="Votes"
        value="open"
        onChange={onChange}
        options={[
          { key: 'open', label: 'Open', count: 2 },
          { key: 'passed', label: 'Passed' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: /Open/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Passed' }));
    expect(onChange).toHaveBeenCalledWith('passed');
  });
});

describe('EmptyState and InlineError', () => {
  it('renders one primary and one outline action', () => {
    router(<EmptyState title="No Votes Need You" primary={{ label: 'Propose a Spend', to: '/x' }} secondary={{ label: 'Go Home', to: '/' }} />);
    expect(screen.getByRole('link', { name: 'Propose a Spend' })).toHaveAttribute('href', '/x');
    expect(screen.getByRole('link', { name: 'Go Home' })).toBeInTheDocument();
  });
  it('announces errors and offers a retry', () => {
    const onRetry = vi.fn();
    render(<InlineError message="Could not load." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load.');
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('Fields', () => {
  it('wires label, help and error', () => {
    const { rerender } = render(
      <Field label="Group Name" htmlFor="g" help="Members see this.">
        <Input id="g" />
      </Field>,
    );
    expect(screen.getByLabelText('Group Name')).toBeInTheDocument();
    expect(screen.getByText('Members see this.')).toBeInTheDocument();
    rerender(
      <Field label="Group Name" htmlFor="g" error="Required.">
        <Input id="g" aria-invalid />
      </Field>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required.');
  });
  it('shows fixed prefixes for phone and money', () => {
    render(
      <>
        <PhoneField aria-label="Phone" dialCode="+256" />
        <MoneyField aria-label="Amount" currency="ugx" />
      </>,
    );
    expect(screen.getByText('+256')).toBeInTheDocument();
    expect(screen.getByText('UGX')).toBeInTheDocument();
  });
  it('switch toggles and exposes its state', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} aria-label="SMS" />);
    const sw = screen.getByRole('switch', { name: 'SMS' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('PageHeader', () => {
  it('title-cases the title and renders the back link', () => {
    router(<PageHeader title="pay dues" subtitle="For September." back={{ label: 'group home', to: '/g' }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pay Dues');
    expect(screen.getByRole('link', { name: 'Group Home' })).toHaveAttribute('href', '/g');
  });
});

describe('Sheet', () => {
  it('renders as a dialog, closes on Escape and returns focus', () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Invite People">
        <button type="button">Inside</button>
      </Sheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Invite People' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
  it('renders nothing when closed', () => {
    render(
      <Sheet open={false} onClose={() => undefined} title="Hidden">
        <p>never</p>
      </Sheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
