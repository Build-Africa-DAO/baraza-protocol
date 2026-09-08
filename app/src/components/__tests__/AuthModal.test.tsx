import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthModal from '@/components/auth/AuthModal';

const { loginWithEmailCode, sendEmailCode } = vi.hoisted(() => ({
  loginWithEmailCode: vi.fn(),
  sendEmailCode: vi.fn(),
}));

vi.mock('@privy-io/react-auth', () => ({
  useLoginWithEmail: () => ({ sendCode: sendEmailCode, loginWithCode: loginWithEmailCode }),
  useLoginWithSms: () => ({ sendCode: vi.fn(), loginWithCode: vi.fn() }),
  useLoginWithOAuth: () => ({ initOAuth: vi.fn(), loading: false }),
}));

vi.mock('@/lib/wallet/mpc', () => ({
  isPrivyPhoneAuthEnabled: () => true,
}));

afterEach(() => {
  cleanup();
  loginWithEmailCode.mockReset();
  sendEmailCode.mockReset().mockResolvedValue(undefined);
});

async function openEmailCodeStep() {
  render(
    <AuthModal
      intent="signin"
      countryCode="KE"
      onIntentChange={vi.fn()}
      onClose={vi.fn()}
    />,
  );

  await userEvent.click(screen.getByRole('button', { name: /email/i }));
  await userEvent.type(screen.getByPlaceholderText('you@email.com'), 'eugene@gmail.com');
  await userEvent.click(screen.getByRole('button', { name: /send code/i }));
  await screen.findByLabelText('Verification code');
}

describe('AuthModal', () => {
  it('keeps the form inside a height-limited dialog and hides the marketing image on small screens', () => {
    render(
      <AuthModal
        intent="signin"
        countryCode="KE"
        onIntentChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/max-h-\[100dvh\]/);
    expect(dialog.className).toMatch(/overflow-y-auto/);

    const imagePane = dialog.querySelector('img[src="/audience/group.jpg"]')?.parentElement;
    expect(imagePane?.className).toMatch(/hidden/);
    expect(imagePane?.className).toMatch(/md:block/);
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <AuthModal
        intent="signin"
        countryCode="KE"
        onIntentChange={vi.fn()}
        onClose={onClose}
      />,
    );

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not send a 5-digit code to Privy', async () => {
    await openEmailCodeStep();

    const submit = screen.getByRole('button', { name: /^sign in$/i });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Verification code'), '73394');
    expect(submit).toBeDisabled();
    expect(loginWithEmailCode).not.toHaveBeenCalled();
  });

  it('submits a full 6-digit code with the email address', async () => {
    loginWithEmailCode.mockResolvedValue(undefined);
    await openEmailCodeStep();

    await userEvent.type(screen.getByLabelText('Verification code'), '073394');

    await waitFor(() => {
      expect(loginWithEmailCode).toHaveBeenCalledWith({ code: '073394' });
    });
  });

  it('explains a Privy 6-digit error in plain language', async () => {
    loginWithEmailCode.mockRejectedValue({
      message: '[Input error] `code`: Verification code must have 6 digits.',
    });
    await openEmailCodeStep();

    await userEvent.type(screen.getByLabelText('Verification code'), '123456');

    expect(await screen.findByText(
      'Enter all 6 digits, including a 0 at the start if there is one.',
    )).toBeInTheDocument();
  });
});
