export type CommunitySetupStep = 'basics' | 'contributions' | 'decisions' | 'account';

export interface CommunityDraftForm {
  name: string;
  type: string;
  fee: string;
  description: string;
  phone: string;
  quorum: string;
  approvalThreshold: string;
  votingPeriod: string;
  treasuryPolicy: string;
}

export interface CommunitySetupDraft {
  step: CommunitySetupStep;
  form: CommunityDraftForm;
  paymentMethod: 'mpesa' | 'wallet';
  addPaybill: boolean;
  addUssd: boolean;
  walletChain: string;
  updatedAt: string;
}

const STORAGE_KEY = 'baraza.community-setup-draft.v1';

export function loadCommunitySetupDraft(): CommunitySetupDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CommunitySetupDraft;
    return parsed?.form && parsed?.step ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCommunitySetupDraft(draft: Omit<CommunitySetupDraft, 'updatedAt'>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
}

export function clearCommunitySetupDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
