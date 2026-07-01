import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  HeartHandshake,
  PartyPopper,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/utils';

interface PurposeOption {
  id: string;
  title: string;
  detail: string;
  preset: string;
  icon: LucideIcon;
}

const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    id: 'monthly-savings',
    title: 'Monthly savings',
    detail: 'Regular contributions and pooled funds for the group.',
    preset: 'savings',
    icon: WalletCards,
  },
  {
    id: 'community-service',
    title: 'Community service',
    detail: 'Organize care work, events, and mutual support.',
    preset: 'welfare',
    icon: HeartHandshake,
  },
  {
    id: 'social-gathering',
    title: 'Social gathering',
    detail: 'Coordinate meetups, milestones, and community rituals.',
    preset: 'professional',
    icon: PartyPopper,
  },
  {
    id: 'business-ventures',
    title: 'Business ventures',
    detail: 'Track shared investments and commercial activity together.',
    preset: 'investment',
    icon: BriefcaseBusiness,
  },
];

export default function CommunityPurpose() {
  useSeo({
    title: 'Choose what your group does together',
    description: 'Choose your community focus so Baraza can prepare a useful governance setup.',
    path: '/create/purpose',
  });

  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const togglePurpose = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((purpose) => purpose !== id)
        : [...current, id],
    );
  };

  const continueToSetup = () => {
    const primary = PURPOSE_OPTIONS.find((option) => selectedSet.has(option.id));
    if (!primary) return;

    const params = new URLSearchParams({
      type: primary.preset,
      purposes: selected.join(','),
    });
    navigate(`/create?${params.toString()}`);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-surface">
          <div className="h-full w-1/2 bg-primary" />
        </div>
        <nav className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6" aria-label="Creation progress">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <BrandLogo size="sm" />
          <span className="text-sm font-semibold text-muted-foreground">Step 1 of 2</span>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-xl text-center">
          <h1 className="mt-3 text-balance font-display text-3xl font-bold leading-tight sm:text-4xl">
            What does your group do together?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
            Choose everything that applies. We will prepare a useful starting setup that you can adjust next.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Community purposes">
          {PURPOSE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedSet.has(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => togglePurpose(option.id)}
                className={cn(
                  'flex min-h-28 items-start gap-4 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 sm:p-5',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/45 hover:bg-surface',
                )}
              >
                <span
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-md',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-surface text-primary',
                  )}
                >
                  {isSelected ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold text-foreground">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {option.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-border/60 bg-background px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground sm:text-left" aria-live="polite">
            {selected.length === 0
              ? 'Choose at least one focus to continue.'
              : `${selected.length} ${selected.length === 1 ? 'focus' : 'focuses'} selected.`}
          </p>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={continueToSetup}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            Continue to setup
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
