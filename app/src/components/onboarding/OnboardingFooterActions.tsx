interface OnboardingFooterActionsProps {
  note: string;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}

export default function OnboardingFooterActions({
  note,
  onBack,
  onContinue,
  canContinue,
}: OnboardingFooterActionsProps) {
  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full bg-[linear-gradient(180deg,transparent_0%,rgba(15,10,0,0.88)_22%,rgba(15,10,0,0.98)_100%)] px-onboarding-margin-mobile pb-6 pt-8 md:px-onboarding-margin-desktop md:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-onboarding-gutter md:flex-row md:items-center md:justify-between">
        <p className="max-w-xl text-sm leading-6 text-onboarding-muted md:text-base">
          {note}
        </p>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-full border border-transparent bg-onboarding-border px-6 py-4 text-sm font-bold text-onboarding-accent transition hover:border-onboarding-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onboarding-accent focus-visible:ring-offset-2 focus-visible:ring-offset-onboarding-surface md:flex-none"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="flex-1 rounded-full bg-onboarding-accent px-7 py-4 text-sm font-bold text-onboarding-surface shadow-[0_16px_40px_rgba(249,115,22,0.22)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onboarding-accent focus-visible:ring-offset-2 focus-visible:ring-offset-onboarding-surface disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:min-w-[10rem]"
          >
            Continue
          </button>
        </div>
      </div>
    </footer>
  );
}
