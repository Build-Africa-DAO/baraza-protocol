import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaccoLicenseUiStatus =
  | 'UNLICENSED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED';

export function saccoBadgeCopy(status: SaccoLicenseUiStatus | string | undefined, type?: string) {
  const isCoop = type === 'sacco' || type === 'cooperative' || type === 'housing';
  if (!isCoop) return null;
  const key = (status ?? 'UNLICENSED') as SaccoLicenseUiStatus;
  if (key === 'VERIFIED') {
    return {
      label: 'Verified SACCO',
      detail: 'Statutory verification approved. Peer lending can activate.',
      className: 'border-confirmed/40 bg-confirmed/10 text-confirmed',
      icon: ShieldCheck,
    };
  }
  if (key === 'PENDING_REVIEW') {
    return {
      label: 'Verification pending',
      detail: 'Under SASRA audit review',
      className: 'border-accent/40 bg-accent/10 text-accent',
      icon: ShieldQuestion,
    };
  }
  if (key === 'EXPIRED' || key === 'REVOKED') {
    return {
      label: key === 'EXPIRED' ? 'License expired' : 'License revoked',
      detail: 'Statutory re-certification is required before peer lending activates.',
      className: 'border-destructive/30 bg-destructive/10 text-destructive',
      icon: ShieldAlert,
    };
  }
  return {
    label: 'Unlicensed cooperative',
    detail: 'Statutory verification required before peer lending activates',
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
    icon: ShieldAlert,
  };
}

export function SaccoComplianceBadge({
  status,
  type,
  licenseNumber,
  expiresAt,
}: {
  status?: string;
  type?: string;
  licenseNumber?: string | null;
  expiresAt?: string | null;
}) {
  const copy = saccoBadgeCopy(status, type);
  if (!copy) return null;
  const Icon = copy.icon;
  const title = [licenseNumber, expiresAt ? `Expires ${expiresAt}` : null].filter(Boolean).join(' · ');
  return (
    <span
      title={title || copy.detail}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider', copy.className)}
    >
      <Icon className={cn('h-3 w-3', status === 'PENDING_REVIEW' && 'animate-pulse')} />
      {copy.label}
    </span>
  );
}
