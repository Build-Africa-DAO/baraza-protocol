import { useState } from 'react';
import { Loader2, Phone } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+254', label: 'KE +254' },
  { code: '+255', label: 'TZ +255' },
  { code: '+256', label: 'UG +256' },
  { code: '+233', label: 'GH +233' },
  { code: '+234', label: 'NG +234' },
  { code: '+27',  label: 'ZA +27'  },
] as const;

interface PhoneEntryProps {
  onSubmit: (phone: string) => Promise<void>;
}

function isValidLocalNumber(digits: string): boolean {
  return /^\d{7,12}$/.test(digits.replace(/\s/g, ''));
}

export default function PhoneEntry({ onSubmit }: PhoneEntryProps) {
  const [countryCode, setCountryCode] = useState('+254');
  const [localNumber, setLocalNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleaned = localNumber.replace(/\s/g, '').replace(/^0+/, '');
  const e164 = `${countryCode}${cleaned}`;
  const canSubmit = isValidLocalNumber(cleaned) && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await onSubmit(e164);
    } catch {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold">Join Baraza</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Enter your phone number to get started. We&apos;ll send a one-time code by SMS.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="phone-input" className="mb-2 block text-xs font-semibold uppercase tracking-wider">
            Phone Number
          </label>
          <div className="flex rounded-lg border focus-within:ring-1 focus-within:ring-primary overflow-hidden">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="border-r bg-muted px-3 py-3 text-sm outline-none cursor-pointer"
              aria-label="Country code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              id="phone-input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value)}
              placeholder="712 345 678"
              className="min-w-0 flex-1 bg-background px-3 py-3 text-sm outline-none"
            />
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-warm w-full justify-center gap-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            'Send Code'
          )}
        </button>
      </form>
    </div>
  );
}
