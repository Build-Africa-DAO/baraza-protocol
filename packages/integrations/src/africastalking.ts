export type UssdState =
  | 'idle'
  | 'invite'
  | 'phone'
  | 'payment'
  | 'wallet'
  | 'complete';

export interface UssdSession {
  sessionId: string;
  state: UssdState;
  phone?: string;
  communityCode?: string;
}

export interface UssdResponse {
  state: UssdState;
  prompt: string;
  complete: boolean;
}

export function createUssdSession(sessionId: string): UssdSession {
  return { sessionId, state: 'idle' };
}

export function advanceUssdSession(session: UssdSession, input: string): UssdResponse {
  const trimmed = input.trim();

  switch (session.state) {
    case 'idle':
      session.state = 'invite';
      return { state: 'invite', prompt: 'Enter invite code', complete: false };
    case 'invite':
      session.communityCode = trimmed;
      session.state = 'phone';
      return { state: 'phone', prompt: 'Enter phone number', complete: false };
    case 'phone':
      session.phone = trimmed;
      session.state = 'payment';
      return { state: 'payment', prompt: 'Confirm KES 20 STK push', complete: false };
    case 'payment':
      session.state = 'wallet';
      return { state: 'wallet', prompt: 'Wallet stub linked. Wait for webhook confirmation.', complete: false };
    case 'wallet':
      session.state = 'complete';
      return { state: 'complete', prompt: 'Membership activation queued', complete: true };
    case 'complete':
    default:
      return { state: 'complete', prompt: 'Session complete', complete: true };
  }
}

