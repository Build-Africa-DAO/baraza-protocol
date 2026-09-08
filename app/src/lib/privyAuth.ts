const PRIVY_OTP_LENGTH = 6;

export function digitsOnly(value: string, max = PRIVY_OTP_LENGTH): string {
  return value.replace(/\D/g, '').slice(0, max);
}

export function isCompletePrivyOtp(value: string): boolean {
  return digitsOnly(value).length === PRIVY_OTP_LENGTH;
}

function rawErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }
  return 'Something went wrong. Try again.';
}

export function formatPrivyAuthError(err: unknown): string {
  const raw = rawErrorMessage(err);
  if (/6 digits/i.test(raw)) {
    return 'Enter all 6 digits, including a 0 at the start if there is one.';
  }
  if (/invalid|incorrect|expired|does not match|wrong code/i.test(raw)) {
    return 'That code is wrong or has expired. Request a new one.';
  }
  if (/\[Input error\]/i.test(raw)) {
    return raw.replace(/^\[Input error\]\s*`[^`]+`:\s*/i, '').trim() || raw;
  }
  return raw;
}

export { PRIVY_OTP_LENGTH };
