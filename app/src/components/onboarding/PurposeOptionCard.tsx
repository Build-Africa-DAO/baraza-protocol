import { motion } from 'framer-motion';
import type { PurposeOption } from '@/components/onboarding/purposeOptions';
import { cn } from '@/lib/utils';

interface PurposeOptionCardProps {
  option: PurposeOption;
  selected: boolean;
  onToggle: (value: PurposeOption['value']) => void;
  index: number;
}

export default function PurposeOptionCard({
  option,
  selected,
  onToggle,
  index,
}: PurposeOptionCardProps) {
  const Icon = option.icon;

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(option.value)}
      className={cn(
        'group flex w-full items-start gap-4 rounded-3xl border px-5 py-5 text-left shadow-onboarding transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onboarding-accent focus-visible:ring-offset-2 focus-visible:ring-offset-onboarding-surface md:px-6 md:py-6',
        selected
          ? 'border-onboarding-accent bg-onboarding-cardActive'
          : 'border-onboarding-border bg-onboarding-card hover:border-onboarding-accent'
      )}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 * index, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.985 }}
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors',
          selected
            ? 'bg-onboarding-accent text-onboarding-surface'
            : 'bg-onboarding-accentSoft text-onboarding-accent group-hover:bg-onboarding-accent group-hover:text-onboarding-surface'
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-onboarding-title font-semibold text-onboarding-text">
          {option.title}
        </span>
        <span className="mt-1 block text-sm leading-6 text-onboarding-muted">
          {option.description}
        </span>
      </span>
    </motion.button>
  );
}
