import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { GroupRow } from '@/components/app/GroupRow';
import { IdentityStrip } from '@/components/app/IdentityStrip';
import { SettingsSection } from '@/components/app/SettingsSection';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Switch } from '@/components/ui/field';
import { FilterChips } from '@/components/ui/filter-chips';
import { InlineError } from '@/components/ui/inline-error';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeletons';
import { StatusChip } from '@/components/ui/status-chip';
import { useAccount } from '@/contexts/AccountContext';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import { useToast } from '@/hooks/use-toast';
import { ACCOUNT_COUNTRIES, type AccountCountryCode } from '@/lib/accountLocale';
import { subscribeWebPush } from '@/lib/push';
import { useSeo } from '@/lib/seo';
import {
  DEFAULT_NOTIFICATIONS,
  PROFILE_LOCALES,
  countryForProfilePatch,
  fetchUserProfile,
  patchUserProfile,
  readLocalLocale,
  writeLocalLocale,
  type SupportedLocale,
  type UserNotificationPreferences,
} from '@/lib/userProfile';

/**
 * §13.20 Account. Name, country and currency, language, notifications, my
 * groups, log out. Nothing about wallets, tokens, badges or bounties: the
 * account is the person, not a profile page.
 */
export default function Profile() {
  useSeo({
    title: 'Account',
    description: 'Your name, country, language, notifications and groups on Baraza.',
    path: '/account',
    noIndex: true,
  });
  const account = useAccount();

  if (!account.ready) {
    return (
      <Layout>
        <section className="py-8 md:py-12">
          <div className="container mx-auto max-w-3xl px-4">
            <SkeletonList count={3} />
          </div>
        </section>
      </Layout>
    );
  }

  if (!account.authenticated) {
    return (
      <Layout>
        <section className="py-8 md:py-12">
          <div className="container mx-auto max-w-md px-4">
            <EmptyState
              title="Your Account"
              body="Sign in with your phone number or email to see your groups, dues and votes."
              primary={{ label: 'Sign In', onClick: () => account.login() }}
              secondary={{ label: 'Create Account', onClick: () => account.createAccount() }}
            >
              {!account.configured ? <p className="text-xs text-muted-foreground">Account access is not available on this deployment yet.</p> : null}
            </EmptyState>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <AccountPanel />
    </Layout>
  );
}

const NOTIFICATION_ROWS: Array<{ key: keyof UserNotificationPreferences; label: string }> = [
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push' },
];

function initialsOf(name: string): string {
  const letters = name.replace(/[^a-z0-9 ]/gi, ' ').trim().split(/\s+/).filter(Boolean);
  const initials = letters.slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
  return initials || 'ME';
}

function AccountPanel() {
  const account = useAccount();
  const { toast } = useToast();
  const { memberships, isLoading, error } = useMyMemberships();
  const [displayName, setDisplayName] = useState(account.displayName);
  const [locale, setLocale] = useState<SupportedLocale>(readLocalLocale);
  const [notifications, setNotifications] = useState<UserNotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [saving, setSaving] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchUserProfile(account.getAccessToken).then((profile) => {
      if (cancelled || !profile) return;
      if (profile.displayName) setDisplayName(profile.displayName);
      if (profile.locale) {
        setLocale(profile.locale);
        writeLocalLocale(profile.locale);
      }
      if (profile.notifications) setNotifications({ ...DEFAULT_NOTIFICATIONS, ...profile.notifications });
    });
    return () => {
      cancelled = true;
    };
  }, [account.getAccessToken]);

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      writeLocalLocale(locale);
      const result = await patchUserProfile(
        { displayName: displayName.trim(), locale, country: countryForProfilePatch(account.country.code), notifications },
        account.getAccessToken,
      );
      if (!result.ok) {
        setSaveError(result.message ?? 'Baraza could not save your account. Sign in again and retry.');
        return;
      }
      toast({ title: 'Saved', description: 'Your name, language and notification settings are updated.' });
    } finally {
      setSaving(false);
    }
  }

  const [confirmLogout, setConfirmLogout] = useState(false);

  async function enablePush() {
    setPushBusy(true);
    try {
      const result = await subscribeWebPush();
      if (result.ok) setNotifications((prev) => ({ ...prev, push: true }));
      toast({ title: result.ok ? 'Push Notifications' : 'Push Not Enabled', description: result.message, variant: result.ok ? 'default' : 'destructive' });
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 md:px-6">
        <PageHeader title="Account" />

        <IdentityStrip
          name={displayName.trim() || account.displayName}
          initials={initialsOf(displayName.trim() || account.displayName)}
          type={account.country.name}
          chip={<StatusChip kind="confirmed" label="Signed In" />}
        />

        {/* Settings as a grid of upright cards, not a stack of wide bands. */}
        <div className="grid gap-4 md:grid-cols-2">
          <SettingsSection id="profile" title="Name" className="h-full">
            <div className="space-y-4">
              <Field label="Display Name" htmlFor="account-name" help="How other members see you in a group.">
                <Input id="account-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection
            id="country"
            title="Country and Currency"
            className="h-full"
            description="Sets your dial code and the currency for groups you start. Money in a group always shows in that group's currency."
          >
            <Field label="Country" htmlFor="account-country">
              <Select id="account-country" value={account.country.code} onChange={(event) => account.setCountry(event.target.value as AccountCountryCode)}>
                {ACCOUNT_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} · {country.currency}
                  </option>
                ))}
              </Select>
            </Field>
          </SettingsSection>

          <SettingsSection id="language" title="Language" description="The language you prefer Baraza to use with you." className="h-full">
            <FilterChips
              options={PROFILE_LOCALES.map((item) => ({ key: item.id, label: item.label }))}
              value={locale}
              onChange={(next) => {
                setLocale(next);
                writeLocalLocale(next);
              }}
              aria-label="Language"
            />
            <dl className="mt-4 divide-y divide-border">
              <div className="py-3">
                <dt className="text-sm text-muted-foreground">App screens</dt>
                <dd className="mt-0.5 text-sm font-semibold">English</dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">Kiswahili and Sheng screens are not translated yet.</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm text-muted-foreground">Akili</dt>
                <dd className="mt-0.5 text-sm font-semibold">Answers in the language you write in</dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">Ask in Kiswahili or Sheng and it replies the same way.</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm text-muted-foreground">Saved</dt>
                <dd className="mt-0.5 text-sm font-semibold">On this device now, with your account when you press Save</dd>
              </div>
            </dl>
          </SettingsSection>

          <SettingsSection id="notifications" title="Notifications" description="How you hear about votes, dues and sends." className="h-full">
            <ul className="grid grid-cols-2 gap-x-6">
              {NOTIFICATION_ROWS.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-4 border-b border-border py-3 [&:nth-last-child(-n+2)]:border-b-0">
                  <label htmlFor={`notify-${row.key}`} className="text-sm font-semibold">
                    {row.label}
                  </label>
                  <Switch
                    id={`notify-${row.key}`}
                    checked={notifications[row.key]}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [row.key]: checked }))}
                    aria-label={`${row.label} notifications`}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => void enablePush()} disabled={pushBusy}>
                {pushBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Enable Push
              </Button>
            </div>
          </SettingsSection>
        </div>

        {saveError ? <InlineError message={saveError} /> : null}
        <Button type="button" onClick={() => void save()} disabled={saving} fullWidth className="sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Save
        </Button>

        <section aria-labelledby="account-groups" className="space-y-3">
          <h2 id="account-groups" className="font-display text-base font-bold">
            Your Groups
          </h2>
          {error ? <InlineError message={error} /> : null}
          {isLoading ? (
            <SkeletonList count={2} />
          ) : memberships.length === 0 ? (
            <EmptyState title="No Groups Yet" body="Join with an invite from a member, or start a group." primary={{ label: 'Browse Groups', to: '/groups' }} secondary={{ label: 'Start a Group', to: '/create' }} />
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {memberships.map((pair) => (
                <li key={pair.community.id}>
                  <GroupRow pair={pair} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="border-t border-border pt-6">
          {confirmLogout ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold">Log out of Baraza on this device?</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirmLogout(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={() => void account.logout()}>
                  Log Out
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="destructive" onClick={() => setConfirmLogout(true)}>
              Log Out
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
