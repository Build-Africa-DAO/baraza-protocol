export interface UssdSession {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  countryCode: string;
  menuStack: string[];
  data: Record<string, unknown>;
  createdAt: number;
  lastActivityAt: number;
}

const SESSION_TTL_MS = 120_000;

const sessions = new Map<string, UssdSession>();

function pruneExpired(): void {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessions) {
    if (session.lastActivityAt < cutoff) {
      sessions.delete(id);
    }
  }
}

export function resolveCountryFromPhone(phone: string): string {
  if (phone.startsWith('+254')) return 'KE';
  if (phone.startsWith('+255')) return 'TZ';
  if (phone.startsWith('+256')) return 'UG';
  if (phone.startsWith('+233')) return 'GH';
  if (phone.startsWith('+234')) return 'NG';
  if (phone.startsWith('+27')) return 'ZA';
  return 'KE';
}

export function getOrCreateSession(params: {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  countryCode: string;
}): UssdSession {
  pruneExpired();

  const existing = sessions.get(params.sessionId);
  if (existing) {
    return existing;
  }

  const session: UssdSession = {
    sessionId: params.sessionId,
    phoneNumber: params.phoneNumber,
    serviceCode: params.serviceCode,
    countryCode: params.countryCode,
    menuStack: [],
    data: {},
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  sessions.set(params.sessionId, session);
  return session;
}

export function updateSession(
  sessionId: string,
  update: Partial<Pick<UssdSession, 'menuStack' | 'data' | 'lastActivityAt'>>,
): UssdSession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  Object.assign(session, update);
  sessions.set(sessionId, session);
  return session;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}
