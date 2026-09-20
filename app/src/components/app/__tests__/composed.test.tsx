import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IdentityStrip } from '@/components/app/IdentityStrip';
import { InitialsTile, ListRow } from '@/components/app/ListRow';
import { ReceiptCard } from '@/components/app/ReceiptCard';
import { SettingsSection } from '@/components/app/SettingsSection';
import { StatusChip } from '@/components/ui/status-chip';

const router = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ListRow', () => {
  it('is a link when given `to` and a button when given `onClick`', () => {
    const onClick = vi.fn();
    router(
      <>
        <ListRow title="Open vote" to="/v/1" />
        <ListRow title="Expand" onClick={onClick} />
        <ListRow title="Static" />
      </>,
    );
    expect(screen.getByRole('link', { name: /Open vote/ })).toHaveAttribute('href', '/v/1');
    fireEvent.click(screen.getByRole('button', { name: /Expand/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByText('Static').closest('a, button')).toBeNull();
  });
  it('initials tile keeps two upper-case letters', () => {
    const { container } = render(<InitialsTile initials="kibera" />);
    expect(container.textContent).toBe('KI');
  });
});

describe('IdentityStrip', () => {
  it('renders name, type and the relationship chip without a photo', () => {
    const { container } = render(
      <IdentityStrip name="Kibera Youth Collective" initials="KY" type="Savings chama" chip={<StatusChip kind="confirmed" label="Active" />} />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kibera Youth Collective');
    expect(screen.getByRole('status', { name: 'Savings chama' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Active' })).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders in a single row layout when singleRow is true', () => {
    const { container } = render(
      <IdentityStrip
        name="123"
        initials="1"
        type="Savings chama"
        chip={<StatusChip kind="info" icon={null} label="Joining" />}
        centered
        singleRow
      />,
    );
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('flex');
    expect(row.className).toContain('items-center');
    expect(row.className).toContain('justify-center');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('123');
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Savings chama')).toBeInTheDocument();
    expect(screen.getByText('Joining')).toBeInTheDocument();
  });
});

describe('SettingsSection', () => {
  const rows = [
    { label: 'Quorum', value: 'Half of members' },
    { label: 'Paybill', value: 'Not Set', officerOnly: true },
  ];
  it('hides officer rows from members instead of showing them locked', () => {
    render(<SettingsSection title="Rules" rows={rows} />);
    expect(screen.getByText('Quorum')).toBeInTheDocument();
    expect(screen.queryByText('Paybill')).toBeNull();
  });
  it('shows officer rows to officers', () => {
    render(<SettingsSection title="Rules" rows={rows} isOfficer />);
    expect(screen.getByText('Paybill')).toBeInTheDocument();
  });
});

describe('ReceiptCard', () => {
  it('shows amount, reference, status and the dispute path when confirmed', () => {
    router(<ReceiptCard amountMinor={50000} currency="KES" reference="QHX7K2" date="12 Sep 2026" status="confirmed" disputeHref="/d" homeHref="/h" />);
    expect(screen.getByText('KES 500')).toBeInTheDocument();
    expect(screen.getByText('QHX7K2')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Confirmed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'File a Dispute' })).toHaveAttribute('href', '/d');
  });
  it('offers retry and hides dispute when failed', () => {
    const onRetry = vi.fn();
    router(<ReceiptCard amountMinor={50000} reference="R" date="d" status="failed" disputeHref="/d" onRetry={onRetry} />);
    expect(screen.queryByRole('link', { name: 'File a Dispute' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry Payment' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
