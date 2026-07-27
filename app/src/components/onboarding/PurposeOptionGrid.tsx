import type { CommunityPurpose, PurposeOption } from '@/components/onboarding/purposeOptions';
import PurposeOptionCard from '@/components/onboarding/PurposeOptionCard';

interface PurposeOptionGridProps {
  options: PurposeOption[];
  selectedPurposes: CommunityPurpose[];
  onToggle: (value: CommunityPurpose) => void;
}

export default function PurposeOptionGrid({
  options,
  selectedPurposes,
  onToggle,
}: PurposeOptionGridProps) {
  return (
    <div className="grid w-full gap-onboarding-gutter md:grid-cols-2">
      {options.map((option, index) => (
        <PurposeOptionCard
          key={option.value}
          option={option}
          selected={selectedPurposes.includes(option.value)}
          onToggle={onToggle}
          index={index}
        />
      ))}
    </div>
  );
}
