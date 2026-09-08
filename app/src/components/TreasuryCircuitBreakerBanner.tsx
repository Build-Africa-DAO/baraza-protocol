import { AlertTriangle } from 'lucide-react';

export const CIRCUIT_BREAKER_COPY =
  'Treasury Circuit Breaker Active: Outbound disbursements are temporarily paused pending scheduled reconciliation review. Member dues and deposits remain fully safe.';

export const DISBURSEMENT_LOCKED_COPY =
  'Disbursements temporarily locked by automated reconciliation circuit breaker.';

export const EXECUTE_LOCKED_COPY =
  'Proposal payouts locked due to treasury circuit breaker.';

export function TreasuryCircuitBreakerBanner({ frozen }: { frozen: boolean }) {
  if (!frozen) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/50 bg-accent/10 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <p className="text-sm leading-6">{CIRCUIT_BREAKER_COPY}</p>
    </div>
  );
}
