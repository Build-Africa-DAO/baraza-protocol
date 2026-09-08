import { Sparkles } from 'lucide-react';
import { useAkiliChat } from '@/akili/useAkiliChat';
import { cn } from '@/lib/utils';

interface AskAkiliProps {
  /** The message that prefills the chat and gets sent on open. */
  prompt: string;
  /** Display label. Defaults to "Ask Akili". */
  label?: string;
  /**
   * Visual variant.
   *   - `pill`    : warm filled rounded button, primary CTA on a page
   *   - `chip`    : outlined chip, secondary affordance inside a card
   *   - `inline`  : underlined link-style, blends inside running copy
   */
  variant?: 'pill' | 'chip' | 'inline';
  className?: string;
}

/**
 * AskAkili — context-aware Akili trigger.
 *
 * Any page can drop this in to open the chat with a route-specific prompt
 * already in flight. The drawer opens, the prompt sends immediately, the
 * member gets an answer scoped to what they were trying to do — no typing.
 *
 * Examples:
 *   <AskAkili prompt="Suggest quorum for a 20-member chama" />
 *   <AskAkili prompt="Summarise this proposal" variant="chip" />
 *   <AskAkili prompt="What does this flag mean?" variant="inline" />
 */
export function AskAkili({
  prompt,
  label = 'Ask Akili',
  variant = 'pill',
  className,
}: AskAkiliProps) {
  const { open } = useAkiliChat();

  const base = 'inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60';

  const styles: Record<NonNullable<AskAkiliProps['variant']>, string> = {
    pill: 'btn-wipe h-9 px-4 text-xs',
    chip: 'btn-wipe-outline h-8 px-3 text-[11px]',
    inline:
      'text-xs font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary',
  };

  return (
    <button
      type="button"
      onClick={() => open(prompt)}
      aria-label={`${label}: ${prompt}`}
      className={cn(base, styles[variant], className)}
    >
      <Sparkles className={variant === 'inline' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
      {label}
    </button>
  );
}

export default AskAkili;
