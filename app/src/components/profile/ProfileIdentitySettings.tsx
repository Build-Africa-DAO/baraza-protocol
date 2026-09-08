import { useEffect, useState } from 'react';
import { Bell, Globe, Loader2, UserRound } from 'lucide-react';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_NOTIFICATIONS,
  PROFILE_LOCALES,
  countryForProfilePatch,
  fetchUserProfile,
  patchUserProfile,
  readLocalLocale,
  subscribeWebPush,
  writeLocalLocale,
  type SupportedLocale,
  type UserNotificationPreferences,
} from '@/lib/userProfile';

export function ProfileIdentitySettings() {
  const account = useAccount();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(account.displayName);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [locale, setLocale] = useState<SupportedLocale>(readLocalLocale);
  const [notifications, setNotifications] = useState<UserNotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [busy, setBusy] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchUserProfile(account.getAccessToken).then((profile) => {
      if (cancelled || !profile) return;
      setDisplayName(profile.displayName || account.displayName);
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatarUrl ?? '');
      if (profile.locale) {
        setLocale(profile.locale);
        writeLocalLocale(profile.locale);
      }
      if (profile.notifications) setNotifications({ ...DEFAULT_NOTIFICATIONS, ...profile.notifications });
    });
    return () => { cancelled = true; };
  }, [account.displayName, account.getAccessToken]);

  async function save() {
    setBusy(true);
    try {
      writeLocalLocale(locale);
      const country = countryForProfilePatch(account.country.code);
      const result = await patchUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        locale,
        country,
        notifications,
        ...(avatarUrl.trim().startsWith('https://') ? { avatarUrl: avatarUrl.trim() } : {}),
      }, account.getAccessToken);
      toast({
        title: result.ok ? 'Profile saved' : 'Could not save profile',
        description: result.ok
          ? 'Display name, language, and notification preferences are updated.'
          : (result.message ?? 'Sign in again and retry.'),
        variant: result.ok ? 'default' : 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  async function enablePush() {
    setPushBusy(true);
    try {
      const result = await subscribeWebPush(account.getAccessToken);
      if (result.ok) setNotifications((prev) => ({ ...prev, push: true }));
      toast({
        title: result.ok ? 'Notifications' : 'Push not enabled',
        description: result.message,
        variant: result.ok ? 'default' : 'destructive',
      });
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="baraza-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          <h2 className="text-sm font-bold">Identity</h2>
        </div>
        <label className="mb-2 block text-xs font-semibold" htmlFor="profile-display-name">Display name</label>
        <input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
        />
        <label className="mb-2 mt-4 block text-xs font-semibold" htmlFor="profile-bio">Bio</label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={500}
          placeholder="A short note about you in this group."
          className="min-h-20 w-full rounded-md border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
        />
        <label className="mb-2 mt-4 block text-xs font-semibold" htmlFor="profile-avatar">Avatar URL (HTTPS)</label>
        <input
          id="profile-avatar"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://"
          className="w-full rounded-md border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {account.accountId ? `Linked account ${account.accountId.slice(0, 6)}…${account.accountId.slice(-4)}` : 'No wallet linked yet.'}
          {account.country.name ? ` · ${account.country.name}` : ''}
        </p>
      </div>

      <div className="baraza-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <h2 className="text-sm font-bold">Language</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROFILE_LOCALES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setLocale(item.id); writeLocalLocale(item.id); }}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${locale === item.id ? 'border-primary bg-primary/10 text-primary' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="baraza-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <h2 className="text-sm font-bold">Notification preferences</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Choose how you hear about proposal votes, dues cycles, and multisig releases.
        </p>
        {([
          ['sms', 'SMS'],
          ['whatsapp', 'WhatsApp'],
          ['email', 'Email'],
          ['push', 'Web push'],
        ] as const).map(([key, label]) => (
          <label key={key} className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={notifications[key]}
              onChange={(event) => setNotifications((prev) => ({ ...prev, [key]: event.target.checked }))}
            />
          </label>
        ))}
        <button type="button" onClick={() => void enablePush()} className="btn-wipe-outline mt-3 gap-2 text-xs" disabled={pushBusy}>
          {pushBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          Enable browser notifications
        </button>
        <button type="button" onClick={() => void save()} className="btn-warm mt-4 w-full justify-center gap-2 py-3 text-sm" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save profile
        </button>
      </div>
    </div>
  );
}
