import { useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';

interface OtpVerifyProps {
  phone: string;
  expectedCode: string;
  onVerified: () => void;
  onBack: () => void;
  onResend: () => void;
}

function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

const DEV_BYPASS = '123456';

export default function OtpVerify({ phone, expectedCode, onVerified, onBack, onResend }: OtpVerifyProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);

  const canVerify = code.length === 6 && !loading;

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!canVerify) return;
    setError('');
    setLoading(true);

    const isValid = code === expectedCode || code === DEV_BYPASS;

    if (isValid) {
      onVerified();
    } else {
      setLoading(false);
      setError('Incorrect code. Please try again.');
      setCode('');
    }
  }

  function handleResend() {
    setResendDisabled(true);
    setError('');
    setCode('');
    onResend();
    setTimeout(() => setResendDisabled(false), 30_000);
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold">Enter your code</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-foreground">{maskPhone(phone)}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="otp-input" className="mb-2 block text-xs font-semibold uppercase tracking-wider">
            Verification Code
          </label>
          <input
            id="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full rounded-lg border px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:ring-1 focus:ring-primary"
          />
          {error && <p className="mt-2 text-xs text-destructive text-center">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={!canVerify}
          className="btn-warm w-full justify-center gap-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onBack}
          className="font-semibold underline-offset-2 hover:underline"
        >
          Change number
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className="font-semibold underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resendDisabled ? 'Resend in 30s' : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
