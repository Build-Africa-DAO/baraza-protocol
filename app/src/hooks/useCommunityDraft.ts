import { useCallback, useState } from 'react';
import {
  clearCommunitySetupDraft,
  loadCommunitySetupDraft,
  saveCommunitySetupDraft,
  type CommunitySetupDraft,
} from '@/lib/communityDraft';

export function useCommunityDraft() {
  const [savedDraft] = useState(loadCommunitySetupDraft);
  const saveDraft = useCallback((draft: Omit<CommunitySetupDraft, 'updatedAt'>) => {
    saveCommunitySetupDraft(draft);
  }, []);
  const clearDraft = useCallback(() => clearCommunitySetupDraft(), []);

  return { savedDraft, saveDraft, clearDraft };
}
