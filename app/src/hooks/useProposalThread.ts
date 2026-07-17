import { useState } from 'react';
import {
  addProposalThreadMessage,
  buildFacilitatorExcerpt,
  listProposalThread,
  type AddProposalThreadMessageInput,
} from '@/lib/proposalThreads';

export function useProposalThread(proposalId: string) {
  const [messages, setMessages] = useState(() => listProposalThread(proposalId));

  const addMessage = (input: Omit<AddProposalThreadMessageInput, 'proposalId'>) => {
    addProposalThreadMessage({ ...input, proposalId });
    setMessages(listProposalThread(proposalId));
  };

  return {
    messages,
    addMessage,
    facilitatorExcerpt: buildFacilitatorExcerpt(messages),
  };
}
