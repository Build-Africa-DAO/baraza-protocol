import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Progress through a fixed set of stages: join, pay, confirming, send.
 * Done = black fill with a tick, current = orange fill with the number,
 * to-do = outline. A failed current step shows a cross in destructive.
 * A hairline joins each step to the next, stopping short of both circles;
 * it turns foreground once the step it leaves is done, so progress reads
 * along the line as well as in the circles. Vertical on phones, horizontal
 * from `sm` up.
 */
export interface StepperStep {
  label: string;
  /** Short helper under the label. Sentence case. */
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the current step. `steps.length` marks all done. */
  current: number;
  /** When the current step has failed rather than being in progress. */
  failed?: boolean;
  /** Force one orientation instead of switching at `sm`. */
  orientation?: 'auto' | 'horizontal' | 'vertical';
  className?: string;
}

export function Stepper({ steps, current, failed = false, orientation = 'auto', className }: StepperProps) {
  const layout =
    orientation === 'horizontal'
      ? 'flex-row'
      : orientation === 'vertical'
        ? 'flex-col'
        : 'flex-col sm:flex-row';
  const itemLayout =
    orientation === 'horizontal'
      ? 'flex-col gap-2'
      : orientation === 'vertical'
        ? 'flex-row gap-3'
        : 'flex-row gap-3 sm:flex-col sm:gap-2';
  // Connector geometry: circles are h-8 w-8, list gap is 0.75rem. Starting
  // 0.5rem past the circle and ending 0.25rem past the item leaves 0.5rem of
  // air at both ends.
  const verticalLine = 'absolute left-4 top-10 -bottom-1 w-px';
  const horizontalLine = 'absolute top-4 left-10 -right-1 h-px';
  // The last step hugs the right edge so the whole row spans the container
  // and the connectors fill the space between, instead of the row stopping
  // two thirds of the way across.
  const lastItemLayout =
    orientation === 'horizontal'
      ? 'flex-none items-end text-right'
      : orientation === 'vertical'
        ? ''
        : 'sm:flex-none sm:items-end sm:text-right';
  const lineLayout =
    orientation === 'horizontal'
      ? horizontalLine
      : orientation === 'vertical'
        ? verticalLine
        : cn(verticalLine, 'sm:left-10 sm:top-4 sm:-right-1 sm:bottom-auto sm:h-px sm:w-auto');

  return (
    <ol className={cn('flex gap-3', layout, className)} aria-label="Progress">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? (failed ? 'failed' : 'current') : 'todo';
        return (
          <li
            key={step.label}
            aria-current={state === 'current' || state === 'failed' ? 'step' : undefined}
            data-state={state}
            className={cn('relative flex min-w-0 flex-1 items-start', itemLayout, index === steps.length - 1 && lastItemLayout)}
          >
            {index < steps.length - 1 ? (
              <span aria-hidden className={cn(lineLayout, state === 'done' ? 'bg-foreground' : 'bg-border')} />
            ) : null}
            <span
              aria-hidden
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold',
                state === 'done' && 'border-foreground bg-foreground text-background',
                state === 'current' && 'border-primary bg-primary text-primary-foreground',
                state === 'failed' && 'border-destructive bg-destructive text-destructive-foreground',
                state === 'todo' && 'border-border text-muted-foreground',
              )}
            >
              {state === 'done' ? <Check className="h-4 w-4" /> : state === 'failed' ? <X className="h-4 w-4" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-xs font-semibold',
                  state === 'todo' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {step.label}
              </span>
              {step.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">{step.description}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
