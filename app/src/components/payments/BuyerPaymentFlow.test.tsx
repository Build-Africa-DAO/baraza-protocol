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

  it('can describe the account method as an external wallet option', () => {
    render(
      <PaymentMethodSelector
        value="privy"
        onChange={() => undefined}
        accountLabel="Account or crypto wallet"
        accountDescription="Use your Baraza account or connect an approved external wallet."
      />,
    );

    expect(screen.getByRole('radio', { name: /account or crypto wallet/i })).toBeChecked();
    expect(screen.getByText(/connect an approved external wallet/i)).toBeInTheDocument();
  });

  it('can render a compact selector without helper descriptions', () => {
    render(
      <PaymentMethodSelector
        value="mobile-money"
        onChange={() => undefined}
        showDescriptions={false}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Mobile money' })).toBeChecked();
    expect(screen.queryByText(/pay from your phone where supported/i)).not.toBeInTheDocument();
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
