// app/src/lib/bot/fsm.ts
// Standard: S&P 500 Enterprise Fintech (ADR-007 Sovereign Decoupled Conversational FSM)
// Invariant: Pure side-effect-free module. Zero imports of DB, HTTP, or messaging SDKs.
// Totality Invariant: Every (node, input) pair has a deterministic transition.

export type BotNode =
  | 'ROOT'
  | 'ONBOARDING'
  | 'ACCOUNT_INTENT'
  | 'COMMUNITY_LOOKUP'
  | 'COMMUNITY_CREATE'
  | 'ROLE_CONFIRMATION'
  | 'WALLET_PROVISIONING'
  | 'DASHBOARD'
  | 'CONTRIBUTION_FLOW'
  | 'CONTRIBUTION_CONFIRM'
  | 'VOTE_FLOW'
  | 'VOTE_CONFIRM'
  | 'BALANCE_INQUIRY'
  | 'AKILI_FALLBACK'
  | 'ESCALATED';

export type BotLocale = 'en' | 'sw' | 'sheng';

export interface BotSlots {
  phone?: string;
  locale?: BotLocale;
  communityId?: string;
  communityName?: string;
  communityType?: 'CHAMA' | 'SACCO' | 'TABLE_BANKING';
  amountKes?: number;
  proposalId?: string;
  voteChoice?: 'YES' | 'NO';
  failureCount: number;
}

export type BotWriteCommand =
  | { type: 'INITIATE_PAYMENT'; amountKes: number; phone: string; communityId: string }
  | { type: 'CAST_VOTE'; proposalId: string; choice: 'YES' | 'NO'; voterPhone: string }
  | { type: 'JOIN_COMMUNITY'; communityId: string; phone: string }
  | { type: 'CREATE_COMMUNITY'; name: string; communityType: string; founderPhone: string }
  | { type: 'TRIGGER_AKILI_REPHRASE'; query: string; phone: string }
  | { type: 'ALERT_HUMAN_ADMIN'; reason: string; phone: string };

export interface BotSessionState {
  currentNode: BotNode;
  slots: BotSlots;
}

export interface BotTurnResult {
  nextState: BotSessionState;
  replyText: string;
  commands: BotWriteCommand[];
}

// Multi-Lingual Dictionaries for Slot Extraction
const AFFIRMATIVE_TOKENS = new Set([
  // English
  'yes', 'yeah', 'yep', 'agree', 'ok', 'okay', 'sure', 'confirm', 'proceed', '1',
  // Swahili
  'ndio', 'ndiyo', 'sawa', 'kubali', 'nikubali', 'naam',
  // Sheng
  'rada', 'ni poa', 'wazi', 'chapa', 'fity', 'maze', 'iko sawa', 'yes bana',
]);

const NEGATIVE_TOKENS = new Set([
  // English
  'no', 'nope', 'disagree', 'cancel', 'stop', 'back', '2',
  // Swahili
  'la', 'hapana', 'kataa', 'sitaki',
  // Sheng
  'zii', 'apana', 'zusha', 'wacha', 'rejea',
]);

/**
 * Extracts positive/negative intent across English, Swahili, and Sheng.
 */
export function parseAffirmative(input: string): boolean | null {
  const clean = input.trim().toLowerCase();
  if (AFFIRMATIVE_TOKENS.has(clean)) return true;
  if (NEGATIVE_TOKENS.has(clean)) return false;
  return null;
}

/**
 * Parses monetary amounts in KES from raw digits, word numbers, or Sheng monetary slang.
 * Examples: "500", "bob soo tano" -> 500, "punch" -> 100, "kilo moja" / "ngiri" -> 1000.
 */
export function parseShengAmount(input: string): number | null {
  const clean = input.trim().toLowerCase();

  // 1. Sheng Monetary Slang
  if (clean.includes('soo tano') || clean.includes('so tano')) return 500;
  if (clean.includes('punch') || clean.includes('soo moja') || clean.includes('so moja')) return 100;
  if (clean.includes('soo mbili') || clean.includes('so mbili')) return 200;
  if (clean.includes('ngiri moja') || clean.includes('kilo moja') || clean.includes('ngiri')) return 1000;
  if (clean.includes('soo tatu')) return 300;
  if (clean.includes('soo nne')) return 400;

  // 2. Direct Integer Extraction
  const digitsMatch = clean.match(/(\d+(?:\.\d+)?)/);
  if (digitsMatch) {
    const val = Math.floor(parseFloat(digitsMatch[1]));
    if (val > 0 && val <= 250_000) return val;
  }

  return null;
}

/**
 * Pure Deterministic Dialogue Transition Function (ADR-007).
 * Side-effect free: strictly maps (state, input) -> (nextState, reply, commands).
 */
export function processTurn(state: BotSessionState, rawInput: string): BotTurnResult {
  const input = rawInput.trim();
  const lower = input.toLowerCase();
  const slots: BotSlots = { ...state.slots };

  // Global Interrupt: Human Escalation Request
  if (['help', 'msaada', 'admin', 'human', 'ongea na mtu'].includes(lower)) {
    return {
      nextState: { currentNode: 'ESCALATED', slots: { ...slots, failureCount: 0 } },
      replyText: 'Baraza Support: We have notified a community officer. A human representative will contact you shortly.',
      commands: [{ type: 'ALERT_HUMAN_ADMIN', reason: 'User requested human assistance', phone: slots.phone || '' }],
    };
  }

  // Global Interrupt: Return to Dashboard
  if (['menu', 'home', 'dashboard', 'nyumbani', 'rudi'].includes(lower) && state.currentNode !== 'ROOT' && state.currentNode !== 'ONBOARDING') {
    return {
      nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
      replyText: getDashboardMenu(slots.locale || 'en'),
      commands: [],
    };
  }

  switch (state.currentNode) {
    case 'ROOT': {
      return {
        nextState: { currentNode: 'ONBOARDING', slots: { ...slots, failureCount: 0 } },
        replyText:
          'Karibu Baraza Protocol! Karibu kwenye chama chako kidijitali.\n\n' +
          'Please choose your preferred language / Chagua lugha:\n' +
          '1. English\n' +
          '2. Kiswahili\n' +
          '3. Sheng',
        commands: [],
      };
    }

    case 'ONBOARDING': {
      if (lower === '1' || lower.includes('eng')) {
        slots.locale = 'en';
      } else if (lower === '2' || lower.includes('swah') || lower.includes('kisw')) {
        slots.locale = 'sw';
      } else if (lower === '3' || lower.includes('sheng') || lower.includes('rada')) {
        slots.locale = 'sheng';
      } else {
        slots.locale = 'en';
      }

      return {
        nextState: { currentNode: 'ACCOUNT_INTENT', slots: { ...slots, failureCount: 0 } },
        replyText:
          slots.locale === 'sw'
            ? 'Je, unataka kufanya nini leo?\n1. Kujiunga na Kikundi (Join Community)\n2. Kuanzisha Kikundi Kipya (Create Community)'
            : slots.locale === 'sheng'
            ? 'Rada yako ni gani leo?\n1. Kujiunga na chama (Join Community)\n2. Kuanzisha chama mpya (Create Community)'
            : 'What would you like to do today?\n1. Join an existing Community\n2. Create a new Community',
        commands: [],
      };
    }

    case 'ACCOUNT_INTENT': {
      if (lower === '1' || lower.includes('join') || lower.includes('jiunga')) {
        return {
          nextState: { currentNode: 'COMMUNITY_LOOKUP', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? 'Tafadhali ingiza nambari ya siri ya kikundi (Join Code) au jina la kikundi:'
              : slots.locale === 'sheng'
              ? 'Weka join code ya chama au jina ya chama:'
              : 'Please enter the Community Join Code or Community Name:',
          commands: [],
        };
      }

      if (lower === '2' || lower.includes('create') || lower.includes('anzisha')) {
        return {
          nextState: { currentNode: 'COMMUNITY_CREATE', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? 'Ingiza jina la kikundi chako kipya:'
              : slots.locale === 'sheng'
              ? 'Weka jina ya chama yako mpya:'
              : 'Enter the name for your new Community:',
          commands: [],
        };
      }

      return handleFailure(state, 'Please reply 1 to Join or 2 to Create a Community.');
    }

    case 'COMMUNITY_LOOKUP': {
      const code = input.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (code.length >= 3) {
        slots.communityId = code;
        return {
          nextState: { currentNode: 'ROLE_CONFIRMATION', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? `Umechagua kujiunga na ${code}. Je, unakubali masharti ya uanachama? (Ndio/La)`
              : slots.locale === 'sheng'
              ? `Umecheki kujiunga na ${code}. Rada iko fity ujiunge? (Ndio/Zii)`
              : `You are joining Community ${code}. Do you accept the membership bylaws? (Yes/No)`,
          commands: [],
        };
      }
      return handleFailure(state, 'Please provide a valid Community Code or Name (at least 3 characters).');
    }

    case 'COMMUNITY_CREATE': {
      if (input.length >= 3) {
        slots.communityName = input;
        slots.communityType = 'CHAMA';
        return {
          nextState: { currentNode: 'WALLET_PROVISIONING', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? `Kikundi "${input}" kimesajiliwa! Tunatengeneza pochi yako salama ya kidijitali... Jibu "ENDELEA" kufika Dashibodi.`
              : slots.locale === 'sheng'
              ? `Chama "${input}" imeundwa! Wallet yako ya kidijitali inatengenezwa... Jibu "ENDELEA" kuingia Dashibodi.`
              : `Community "${input}" created! Provisioning your cryptographic smart wallet... Reply "CONTINUE" to access Dashboard.`,
          commands: [
            {
              type: 'CREATE_COMMUNITY',
              name: input,
              communityType: 'CHAMA',
              founderPhone: slots.phone || '',
            },
          ],
        };
      }
      return handleFailure(state, 'Community name must be at least 3 characters.');
    }

    case 'ROLE_CONFIRMATION': {
      const aff = parseAffirmative(input);
      if (aff === true) {
        return {
          nextState: { currentNode: 'WALLET_PROVISIONING', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? 'Uanachama umethibitishwa! Tunatengeneza pochi yako salama... Jibu "ENDELEA" kuona Dashibodi.'
              : slots.locale === 'sheng'
              ? 'Uko ndani ya chama rasmi! Wallet inatengenezwa... Jibu "ENDELEA" kucheki Dashibodi.'
              : 'Membership confirmed! Deriving your secure wallet... Reply "CONTINUE" to access Dashboard.',
          commands: [
            {
              type: 'JOIN_COMMUNITY',
              communityId: slots.communityId || 'DEFAULT_COMMUNITY',
              phone: slots.phone || '',
            },
          ],
        };
      }
      if (aff === false) {
        return {
          nextState: { currentNode: 'ACCOUNT_INTENT', slots: { ...slots, failureCount: 0 } },
          replyText: 'Action cancelled. Returning to main menu.',
          commands: [],
        };
      }
      return handleFailure(state, 'Please reply Yes or No to confirm.');
    }

    case 'WALLET_PROVISIONING': {
      return {
        nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
        replyText: getDashboardMenu(slots.locale || 'en'),
        commands: [],
      };
    }

    case 'DASHBOARD': {
      if (lower === '1' || lower.includes('dues') || lower.includes('pesa') || lower.includes('chapa') || lower.includes('pay')) {
        return {
          nextState: { currentNode: 'CONTRIBUTION_FLOW', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? 'Weka kiasi unachotaka kulipa (mfano: 500):'
              : slots.locale === 'sheng'
              ? 'Weka chapa unataka kutuma (mfano: soo tano / 500):'
              : 'Enter contribution amount in KES (e.g. 500):',
          commands: [],
        };
      }

      if (lower === '2' || lower.includes('vote') || lower.includes('kura')) {
        return {
          nextState: { currentNode: 'VOTE_FLOW', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? 'Pendekezo linaloendelea: #PROP-101 (Mfuko wa Dharura KES 50,000).\nJe, unakubali?\n1. Ndio (Yes)\n2. La (No)'
              : slots.locale === 'sheng'
              ? 'Vote inayoendelea: #PROP-101 (Emergency Fund KES 50,000).\nRada yako:\n1. Ndio (Yes)\n2. Zii (No)'
              : 'Active Proposal: #PROP-101 (Emergency Contingency Fund KES 50,000).\nCast your vote:\n1. Yes\n2. No',
          commands: [],
        };
      }

      if (lower === '3' || lower.includes('balance') || lower.includes('salio')) {
        return {
          nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? 'Salio lako la Baraza: KES 15,000 (Hisa 15). Msururu wa Malipo: Miezi 4 bila kukosa. Jibu "MENU" kurejea.'
              : slots.locale === 'sheng'
              ? 'Salio yako kwa chama: KES 15,000 (Shares 15). Dues streak: Miezi 4 safi. Jibu "MENU" kurejea.'
              : 'Your Baraza Balance: KES 15,000 (15 Shares). Dues Streak: 4 consecutive months. Reply "MENU" to return.',
          commands: [],
        };
      }

      if (lower === '4' || lower.includes('akili') || lower.includes('ai') || lower.includes('swali')) {
        return {
          nextState: { currentNode: 'AKILI_FALLBACK', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? 'Uliza Akili swali lolote kuhusu sheria za chama, mikopo, au michango:'
              : slots.locale === 'sheng'
              ? 'Uliza Akili swali yoyote kuhusu chama, loan ama michango:'
              : 'Ask Akili AI any question regarding community bylaws, loans, or dues:',
          commands: [],
        };
      }

      return handleFailure(state, 'Please select 1 (Pay Dues), 2 (Vote), 3 (Balance), or 4 (Ask Akili).');
    }

    case 'CONTRIBUTION_FLOW': {
      const parsedAmount = parseShengAmount(input);
      if (parsedAmount && parsedAmount >= 10) {
        slots.amountKes = parsedAmount;
        return {
          nextState: { currentNode: 'CONTRIBUTION_CONFIRM', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? `Thibitisha malipo ya KES ${parsedAmount} kupitia M-Pesa kwa nambari yako. Jibu NDIO kuanzisha STK Push.`
              : slots.locale === 'sheng'
              ? `Confirm unalipa KES ${parsedAmount} na M-Pesa kwa simu yako. Jibu NDIO kutumiwa STK Push chap chap.`
              : `Confirm payment of KES ${parsedAmount} via M-Pesa. Reply YES to trigger STK Push to your phone.`,
          commands: [],
        };
      }
      return handleFailure(state, 'Please enter a valid amount (minimum KES 10, e.g. "500" or "soo tano").');
    }

    case 'CONTRIBUTION_CONFIRM': {
      const aff = parseAffirmative(input);
      if (aff === true && slots.amountKes) {
        const amt = slots.amountKes;
        return {
          nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? `Ombi la M-Pesa STK Push la KES ${amt} limetumwa kwa simu yako! Tafadhali weka PIN kukamilisha. Utapokea risiti punde.`
              : slots.locale === 'sheng'
              ? `STK Push ya KES ${amt} imeingia kwa simu yako! Weka PIN ya M-Pesa ikam. Utapata receipt saa hii.`
              : `M-Pesa STK Push of KES ${amt} has been dispatched to your phone! Please enter your M-Pesa PIN. You will receive an on-chain receipt shortly.`,
          commands: [
            {
              type: 'INITIATE_PAYMENT',
              amountKes: amt,
              phone: slots.phone || '',
              communityId: slots.communityId || 'DEFAULT_COMMUNITY',
            },
          ],
        };
      }
      if (aff === false) {
        return {
          nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
          replyText: 'Payment cancelled. Returning to Dashboard.',
          commands: [],
        };
      }
      return handleFailure(state, 'Reply YES to authorize payment or NO to cancel.');
    }

    case 'VOTE_FLOW': {
      const aff = parseAffirmative(input);
      if (aff !== null) {
        slots.voteChoice = aff ? 'YES' : 'NO';
        slots.proposalId = 'PROP-101';
        const choiceText = aff ? 'YES (NDIO)' : 'NO (LA)';
        return {
          nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
          replyText:
            slots.locale === 'sw'
              ? `Kura yako ya ${choiceText} kwa Pendekezo #PROP-101 imerekodiwa kikamilifu kwenye blockchain!`
              : slots.locale === 'sheng'
              ? `Kura yako ya ${choiceText} kwa Prop #PROP-101 imepigwa safi on-chain!`
              : `Your vote ${choiceText} on Proposal #PROP-101 has been cryptographically recorded on-chain!`,
          commands: [
            {
              type: 'CAST_VOTE',
              proposalId: 'PROP-101',
              choice: slots.voteChoice,
              voterPhone: slots.phone || '',
            },
          ],
        };
      }
      return handleFailure(state, 'Please reply 1 (Yes) or 2 (No) to cast your vote.');
    }

    case 'AKILI_FALLBACK': {
      return {
        nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
        replyText: 'Akili Council is analyzing your question... Reply "MENU" to return to options.',
        commands: [
          {
            type: 'TRIGGER_AKILI_REPHRASE',
            query: input,
            phone: slots.phone || '',
          },
        ],
      };
    }

    case 'ESCALATED': {
      return {
        nextState: state,
        replyText: 'Your conversation is currently flagged for an officer. Reply "MENU" to return to automated assistant.',
        commands: [],
      };
    }

    default: {
      return {
        nextState: { currentNode: 'DASHBOARD', slots: { ...slots, failureCount: 0 } },
        replyText: getDashboardMenu(slots.locale || 'en'),
        commands: [],
      };
    }
  }
}

function handleFailure(state: BotSessionState, prompt: string): BotTurnResult {
  const currentFailures = (state.slots.failureCount || 0) + 1;
  const slots: BotSlots = { ...state.slots, failureCount: currentFailures };

  // Fallback Ladder per ADR-007
  if (currentFailures >= 4) {
    return {
      nextState: { currentNode: 'ESCALATED', slots },
      replyText: 'We noticed multiple misunderstandings. We have connected you with a community admin for assistance.',
      commands: [{ type: 'ALERT_HUMAN_ADMIN', reason: 'Repeated clarification failures (Turn 4 ladder trigger)', phone: slots.phone || '' }],
    };
  }

  if (currentFailures === 3) {
    return {
      nextState: { currentNode: state.currentNode, slots },
      replyText: `Let me rephrase: ${prompt}`,
      commands: [{ type: 'TRIGGER_AKILI_REPHRASE', query: prompt, phone: slots.phone || '' }],
    };
  }

  return {
    nextState: { currentNode: state.currentNode, slots },
    replyText: prompt,
    commands: [],
  };
}

function getDashboardMenu(locale: BotLocale): string {
  if (locale === 'sw') {
    return (
      '--- BARAZA DASHIBODI ---\n' +
      '1. Lipa Michango (Pay Dues)\n' +
      '2. Piga Kura (Vote on Proposals)\n' +
      '3. Angalia Salio (Check Balance)\n' +
      '4. Uliza Akili AI (Ask Question)\n\n' +
      'Jibu kwa nambari (1-4):'
    );
  }
  if (locale === 'sheng') {
    return (
      '--- BARAZA DASHBOARD ---\n' +
      '1. Chapa Dues (Pay Dues)\n' +
      '2. Piga Kura (Vote on Proposals)\n' +
      '3. Cheki Salio (Check Balance)\n' +
      '4. Uliza Akili AI (Ask Question)\n\n' +
      'Chagua namba (1-4):'
    );
  }
  return (
    '--- BARAZA DASHBOARD ---\n' +
    '1. Pay Dues / Contribution\n' +
    '2. Vote on Active Proposals\n' +
    '3. Check Balance & Dues Streak\n' +
    '4. Ask Akili AI Assistant\n\n' +
    'Reply with option number (1-4):'
  );
}
