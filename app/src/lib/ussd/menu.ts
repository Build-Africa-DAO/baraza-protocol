import type { UssdSession } from './session';

export interface PendingPayOrder {
  communityCode: string;
  phoneNumber: string;
  amount: number;
  currency: string;
}

export interface MenuResult {
  text: string;
  action: 'CON' | 'END';
  /** Set when the USSD handler should create a payment order after returning this response. */
  pendingPayOrder?: PendingPayOrder;
}

const MOCK_COMMUNITIES = [
  { id: '1', name: 'Kibera Youth Collective', memberCount: 47, adminPhone: '+254700000001' },
  { id: '2', name: 'Mama Mboga Association', memberCount: 123, adminPhone: '+254700000002' },
];

const MOCK_PROPOSALS = [
  { id: 'd1', title: 'Purchase Shared Boda-Boda' },
  { id: 'd2', title: 'Emergency Fund for Members' },
];

function mainMenu(): MenuResult {
  return {
    text: 'Baraza\n1. My Balance\n2. Vote\n3. Pay Dues\n4. Community\n5. Help',
    action: 'CON',
  };
}

function balanceMenu(path: string[]): MenuResult {
  if (path.length === 1) {
    return {
      text: 'Balance\nRAZA: 0\nChecking on-chain...',
      action: 'CON',
    };
  }
  return {
    text: 'Your balance: 0 RAZA\nVisit baraza.app for full details.',
    action: 'END',
  };
}

function voteMenu(path: string[]): MenuResult {
  if (path.length === 1) {
    const lines = ['Active Proposals'];
    MOCK_PROPOSALS.forEach((p, i) => lines.push(`${i + 1}. ${p.title}`));
    lines.push('0. Back');
    return { text: lines.join('\n'), action: 'CON' };
  }

  const proposalIdx = parseInt(path[1] ?? '', 10) - 1;
  if (path[1] === '0') return mainMenu();

  const proposal = MOCK_PROPOSALS[proposalIdx];
  if (!proposal) {
    return { text: 'Invalid selection. Please try again.', action: 'END' };
  }

  if (path.length === 2) {
    return {
      text: `Vote on: ${proposal.title}\n1. For\n2. Against\n0. Back`,
      action: 'CON',
    };
  }

  const choice = path[2];
  if (choice === '0') {
    const lines = ['Active Proposals'];
    MOCK_PROPOSALS.forEach((p, i) => lines.push(`${i + 1}. ${p.title}`));
    lines.push('0. Back');
    return { text: lines.join('\n'), action: 'CON' };
  }

  if (choice !== '1' && choice !== '2') {
    return { text: 'Invalid vote choice.', action: 'END' };
  }

  const voteLabel = choice === '1' ? 'FOR' : 'AGAINST';

  if (path.length === 3) {
    return {
      text: `Confirm vote ${voteLabel}?\n1. Yes\n2. No`,
      action: 'CON',
    };
  }

  const confirm = path[3];
  if (confirm === '2') {
    return { text: 'Vote cancelled.', action: 'END' };
  }
  if (confirm === '1') {
    return {
      text: 'Vote queued. Will broadcast when online.',
      action: 'END',
    };
  }

  return { text: 'Invalid confirmation.', action: 'END' };
}

function payDuesMenu(path: string[], phoneNumber: string): MenuResult {
  if (path.length === 1) {
    return { text: 'Pay Dues\nEnter community code:', action: 'CON' };
  }

  if (path.length === 2) {
    return {
      text: 'Amount: 100 KES\n1. Confirm\n2. Cancel',
      action: 'CON',
    };
  }

  const communityCode = path[1] ?? '';
  const confirm = path[2];
  if (confirm === '2') return { text: 'Payment cancelled.', action: 'END' };
  if (confirm === '1') {
    return {
      text: `Processing payment for ${phoneNumber}. You will receive an SMS with your order details.`,
      action: 'END',
      pendingPayOrder: { communityCode, phoneNumber, amount: 100, currency: 'KES' },
    };
  }

  return { text: 'Invalid selection.', action: 'END' };
}

function communityMenu(path: string[]): MenuResult {
  if (path.length === 1) {
    const lines = ['My Communities'];
    MOCK_COMMUNITIES.forEach((c, i) => lines.push(`${i + 1}. ${c.name}`));
    lines.push('0. Back');
    return { text: lines.join('\n'), action: 'CON' };
  }

  if (path[1] === '0') return mainMenu();

  const communityIdx = parseInt(path[1] ?? '', 10) - 1;
  const community = MOCK_COMMUNITIES[communityIdx];
  if (!community) {
    return { text: 'Invalid selection.', action: 'END' };
  }

  if (path.length === 2) {
    return {
      text: `${community.name}\nMembers: ${community.memberCount}\n1. Contact admin\n0. Back`,
      action: 'CON',
    };
  }

  if (path[2] === '0') {
    const lines = ['My Communities'];
    MOCK_COMMUNITIES.forEach((c, i) => lines.push(`${i + 1}. ${c.name}`));
    lines.push('0. Back');
    return { text: lines.join('\n'), action: 'CON' };
  }

  return {
    text: `Contact admin at ${community.adminPhone}`,
    action: 'END',
  };
}

function helpMenu(): MenuResult {
  return {
    text: 'Baraza Help\nVote & pay dues via USSD\nWeb: baraza.app\nSupport: *384*0#\nPowered by Solana',
    action: 'END',
  };
}

export function handleUssdInput(params: {
  session: UssdSession;
  text: string;
  phoneNumber: string;
}): MenuResult {
  const { text, phoneNumber } = params;

  if (text === '') {
    return mainMenu();
  }

  const path = text.split('*');
  const root = path[0];

  switch (root) {
    case '1':
      return balanceMenu(path);
    case '2':
      return voteMenu(path);
    case '3':
      return payDuesMenu(path, phoneNumber);
    case '4':
      return communityMenu(path);
    case '5':
      return helpMenu();
    default:
      return { text: 'Invalid option. Please try again.', action: 'END' };
  }
}
