interface OnboardingProgressProps {
  value: number;
}

export default function OnboardingProgress({ value }: OnboardingProgressProps) {
  return (
    <div className="h-1.5 w-full bg-onboarding-panel">
      <div
        className="h-full bg-onboarding-accentStrong transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
