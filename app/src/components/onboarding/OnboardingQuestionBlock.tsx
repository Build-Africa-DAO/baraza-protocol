interface OnboardingQuestionBlockProps {
  title: string;
  description: string;
}

export default function OnboardingQuestionBlock({
  title,
  description,
}: OnboardingQuestionBlockProps) {
  return (
    <div className="mx-auto mb-onboarding-stack-lg max-w-2xl text-center">
      <h1 className="text-balance font-display text-onboarding-headline-mobile font-bold text-onboarding-text md:text-onboarding-headline-desktop">
        {title}
      </h1>
      <p className="mx-auto mt-onboarding-stack-sm max-w-xl text-onboarding-body text-onboarding-muted">
        {description}
      </p>
    </div>
  );
}
