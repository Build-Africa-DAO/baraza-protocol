import { Mail, MapPin, ShieldCheck, Smartphone, UserPlus } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAccount } from '@/contexts/AccountContext';
import { ACCOUNT_COUNTRIES, type AccountCountryCode } from '@/lib/accountLocale';
import { useSeo } from '@/lib/seo';
import { isPrivySmsEnabled } from '@/lib/wallet/mpc';

export default function Login() {
  const account = useAccount();
  const [searchParams] = useSearchParams();
  const creatingAccount = searchParams.get('mode') === 'create';
  const smsEnabled = isPrivySmsEnabled();

  useSeo({
    title: creatingAccount ? 'Create your Baraza account' : 'Log in to Baraza',
    description: 'Choose your country, then securely access your Baraza account.',
    path: '/login',
    noIndex: true,
  });

  if (account.authenticated) return <Navigate to="/profile" replace />;

  const continueToPrivy = () => {
    if (creatingAccount) account.createAccount();
    else account.login();
  };

  return (
    <Layout>
      <section className="py-8 sm:py-14">
        <div className="container mx-auto max-w-lg px-4 sm:px-6">
          <header className="border-b border-border pb-6">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-balance font-display text-2xl font-bold sm:text-3xl">
              {creatingAccount ? 'Create your Baraza account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
              Confirm your country first. Baraza uses it to show the right currency and payment options from your first session.
            </p>
          </header>

          <div className="py-6">
            <label htmlFor="login-country" className="flex items-center gap-2 text-sm font-bold">
              <MapPin className="h-4 w-4 text-primary" />
              Country and currency
            </label>
            <select
              id="login-country"
              value={account.country.code}
              onChange={(event) => account.setCountry(event.target.value as AccountCountryCode)}
              className="mt-3 min-h-12 w-full rounded-md border bg-background px-3 text-base font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {ACCOUNT_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} - {country.currency}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-muted-foreground">
              Amounts will be displayed in {account.country.currency}. You can change this later in Settings.
            </p>
          </div>

          <div className="border-t border-border py-6">
            <h2 className="text-base font-bold">Secure sign-in</h2>
            <div className="mt-4 flex items-start gap-3 rounded-md border border-border bg-surface/55 p-4">
              {smsEnabled ? <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
              <div>
                <p className="text-sm font-bold">{smsEnabled ? 'Phone number or email' : 'Email one-time code'}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {smsEnabled
                    ? 'Choose phone or email in the next secure step.'
                    : 'International SMS is not active on this deployment yet. Email opens the same Baraza account without the failed SMS step.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={continueToPrivy}
              disabled={!account.ready || !account.configured}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-wait disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              Continue securely
            </button>

            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Your sign-in and recovery are protected by Privy. Baraza never asks for a seed phrase.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
