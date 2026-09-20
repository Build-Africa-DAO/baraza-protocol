import { useMemo } from 'react';
import { useLoginWithEmail, useLoginWithOAuth, useLoginWithSms } from '@privy-io/react-auth';
import { AuthModalView, type AuthActions, type AuthModalProps } from '@/components/auth/AuthModalView';
import { isPrivyPhoneAuthEnabled } from '@/lib/wallet/mpc';
import { formatPrivyAuthError } from '@/lib/privyAuth';

export type { AuthActions, AuthIntent, AuthMethod, AuthModalProps } from '@/components/auth/AuthModalView';
export { AuthModalView, BarazaAuthModal } from '@/components/auth/AuthModalView';

/** The modal on Privy: email and SMS codes plus Privy's Google OAuth. */
export default function AuthModal(props: AuthModalProps) {
  const phoneEnabled = isPrivyPhoneAuthEnabled();
  const { sendCode: sendEmailCode, loginWithCode: loginWithEmailCode } = useLoginWithEmail();
  const { sendCode: sendSmsCode, loginWithCode: loginWithSmsCode } = useLoginWithSms();
  const { initOAuth, loading: googleLoading } = useLoginWithOAuth();

  const actions = useMemo<AuthActions>(
    () => ({
      phoneEnabled,
      sendCode: async ({ method, destination, isSignUp }) => {
        if (method === 'email') await sendEmailCode({ email: destination, disableSignup: !isSignUp });
        else await sendSmsCode({ phoneNumber: destination, disableSignup: !isSignUp });
      },
      verifyCode: async ({ method, code }) => {
        if (method === 'email') await loginWithEmailCode({ code });
        else await loginWithSmsCode({ code });
      },
      continueWithGoogle: async (isSignUp) => {
        await initOAuth({ provider: 'google', disableSignup: !isSignUp });
      },
      googleLoading,
      formatError: formatPrivyAuthError,
    }),
    [googleLoading, initOAuth, loginWithEmailCode, loginWithSmsCode, phoneEnabled, sendEmailCode, sendSmsCode],
  );

  return <AuthModalView {...props} actions={actions} />;
}
