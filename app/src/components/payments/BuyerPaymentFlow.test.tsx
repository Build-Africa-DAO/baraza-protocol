import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PaymentMethodSelector, PaymentSummary } from './BuyerPaymentFlow';

describe('PaymentMethodSelector', () => {
  it('shows the three buyer-facing payment methods without infrastructure names', () => {
    render(<PaymentMethodSelector value="mobile-money" onChange={() => undefined} />);

    expect(screen.getByRole('radio', { name: /mobile money/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /baraza account/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /bank \/ swift/i })).toBeInTheDocument();
    expect(screen.queryByText(/stellar|solana|ethereum|network/i)).not.toBeInTheDocument();
  });

  it('reports the selected method', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentMethodSelector value="mobile-money" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /baraza account/i }));
    expect(onChange).toHaveBeenCalledWith('privy');
  });
});

describe('PaymentSummary', () => {
  it('renders line items and the total', () => {
    render(
      <PaymentSummary
        lines={[{ label: 'Monthly dues', value: 'KSh 500' }]}
        total="KSh 500"
        totalLabel="Pay now"
      />,
    );

    expect(screen.getByText('Monthly dues')).toBeInTheDocument();
    expect(screen.getAllByText('KSh 500')).toHaveLength(2);
    expect(screen.getByText('Pay now')).toBeInTheDocument();
  });
});
