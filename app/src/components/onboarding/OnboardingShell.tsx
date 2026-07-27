import type { ReactNode } from 'react';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';

interface OnboardingShellProps {
  children: ReactNode;
  progressValue: number;
  onSkip: () => void;
  showSkip?: boolean;
  footer?: ReactNode;
}

export default function OnboardingShell({
  children,
  progressValue,
  onSkip,
  showSkip = true,
  footer,
}: OnboardingShellProps) {
  return (
    <div className="dark">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-onboarding-bg text-onboarding-text">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.18),transparent_60%)]"
        />
        <header className="fixed left-0 top-0 z-30 w-full bg-onboarding-surface backdrop-blur-md">
          <OnboardingProgress value={progressValue} />
          <OnboardingHeader onSkip={onSkip} showSkip={showSkip} />
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-onboarding-margin-mobile pb-12 pt-28 md:px-onboarding-margin-desktop">
          <div className="relative z-10 w-full">{children}</div>
        </main>

        {footer}
      </div>
    </div>
  );
}
