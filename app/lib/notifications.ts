export type EventType =
  | "new_bounty" | "new_bid" | "bid_accepted" | "bid_rejected"
  | "status_changed" | "payment_processed" | "comment_reply"
  | "mention" | "achievement" | "dao_invitation" | "security_alert";

export interface Notification {
  id: string;
  eventType: EventType;
  title: string;
  body: string;
  actionUrl: string;
  actionLabel: string;
  read: boolean;
  createdAt: Date;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    eventType: "new_bounty",
    title: "New bounty posted",
    body: "Web3 Developer Needed — Create a smart contract audit tool",
    actionUrl: "/?tab=bounties",
    actionLabel: "View Bounties",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "n2",
    eventType: "bid_accepted",
    title: "Bid accepted",
    body: 'Your bid on "Mobile App Design" was accepted by TechDAO',
    actionUrl: "/?tab=bounties",
    actionLabel: "View Bounties",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "n3",
    eventType: "comment_reply",
    title: "Comment reply",
    body: 'Sarah replied on "UI/UX Improvements": "Great work on the wireframes!"',
    actionUrl: "/?tab=bounties",
    actionLabel: "View Bounties",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "n4",
    eventType: "payment_processed",
    title: "Payment received",
    body: 'Payment of $500 USDC received from FinanceDAO for "Smart Contract Audit"',
    actionUrl: "/inbox",
    actionLabel: "View Receipt",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "n5",
    eventType: "dao_invitation",
    title: "DAO invitation",
    body: "You've been invited to join CryptoDAO",
    actionUrl: "/?tab=daos",
    actionLabel: "View DAOs",
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export const EVENT_ICONS: Record<EventType, string> = {
  new_bounty:       "🟢",
  new_bid:          "📢",
  bid_accepted:     "✅",
  bid_rejected:     "❌",
  status_changed:   "📋",
  payment_processed:"💰",
  comment_reply:    "💬",
  mention:          "📣",
  achievement:      "🏆",
  dao_invitation:   "🎉",
  security_alert:   "🚨",
};
