import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAccount } from '@/contexts/AccountContext';
import { ACCOUNT_COUNTRIES, type AccountCountryCode } from '@/lib/accountLocale';
import { useSeo } from '@/lib/seo';

export default function ProfileSettings() {
  const account = useAccount();
  useSeo({
    title: 'Account settings',
    description: 'Manage your Baraza account country, currency, and security.',
    path: '/profile/settings',
    noIndex: true,
  });

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-2xl px-4">
          <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to profile
          </Link>
          <header className="mt-5 border-b border-border pb-6">
            <h1 className="font-display text-2xl font-bold">Account settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage private account preferences. These details do not appear on your public profile.</p>
          </header>

          <div className="divide-y divide-border">
            <section className="py-6" aria-labelledby="region-title">
              <h2 id="region-title" className="text-base font-bold">Country and currency</h2>
              <p className="mt-1 text-sm text-muted-foreground">Baraza uses this preference when displaying amounts and payment options.</p>
              <label htmlFor="account-country-settings" className="mt-5 block text-sm font-semibold">Account country</label>
              <select
                id="account-country-settings"
                value={account.country.code}
                onChange={(event) => account.setCountry(event.target.value as AccountCountryCode)}
                className="mt-2 min-h-12 w-full rounded-md border bg-background px-3 text-base font-semibold outline-none focus:border-primary"
              >
                {ACCOUNT_COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name} - {country.currency}</option>)}
              </select>
              <p className="mt-2 text-sm text-muted-foreground">Amounts are displayed in {account.country.currency}. Payment providers confirm the final rate before payment.</p>
            </section>

            <section className="py-6" aria-labelledby="security-title">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 id="security-title" className="text-base font-bold">Account security</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Privy secures sign-in and recovery through your verified phone number or email.</p>
                  {account.verifiedContact && <p className="mt-3 text-sm font-semibold">Verified: {account.verifiedContact}</p>}
                </div>
              </div>
            </section>

            <section className="py-6">
              <button type="button" onClick={() => void account.logout()} disabled={!account.authenticated} className="btn-ghost inline-flex min-h-11 items-center gap-2 disabled:opacity-50">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </section>
          </div>
        </div>
      </section>
    </Layout>
  );
}
