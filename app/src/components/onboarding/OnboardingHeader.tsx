interface OnboardingHeaderProps {
  onSkip: () => void;
  showSkip?: boolean;
}

export default function OnboardingHeader({ onSkip, showSkip = true }: OnboardingHeaderProps) {
  return (
    <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-onboarding-margin-mobile py-4 md:px-onboarding-margin-desktop">
      <div className="flex items-center gap-2.5">
        <img
          src="/baraza-logo-v2.svg"
          alt="Baraza logo"
          className="h-8 w-8 shrink-0 rounded-lg"
        />
        <span className="font-display text-onboarding-headline-mobile font-bold tracking-tight text-onboarding-text">
          <span>bara</span>
          <span className="text-onboarding-accent">za</span>
        </span>
      </div>
      {showSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-bold uppercase tracking-[0.18em] text-onboarding-muted transition-colors hover:text-onboarding-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onboarding-accent focus-visible:ring-offset-2 focus-visible:ring-offset-onboarding-surface"
        >
          Skip
        </button>
      )}
    </nav>
  );
}
