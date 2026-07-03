import {
  sendSms,
  formatVoteConfirmation,
  formatDuesReminder,
  formatMemberWelcome,
} from './sms';

export type NotificationEvent =
  | { type: 'vote_cast'; communityName: string; proposalTitle: string; decision: 'FOR' | 'AGAINST'; phone: string }
  | { type: 'dues_reminder'; communityName: string; amountKes: number; dueDate: string; phone: string }
  | { type: 'member_welcome'; communityName: string; adminPhone: string; phone: string }
  | { type: 'proposal_created'; communityName: string; proposalTitle: string; phone: string }
  | { type: 'payment_confirmed'; communityName: string; amountKes: number; phone: string };

export async function dispatchNotification(event: NotificationEvent): Promise<void> {
  try {
    let message: string;

    switch (event.type) {
      case 'vote_cast':
        message = formatVoteConfirmation(event.communityName, event.decision);
        break;

      case 'dues_reminder':
        message = formatDuesReminder(event.communityName, event.amountKes, event.dueDate);
        break;

      case 'member_welcome':
        message = formatMemberWelcome(event.communityName, event.adminPhone);
        break;

      case 'proposal_created':
        message = `Baraza: New proposal in ${event.communityName}: "${event.proposalTitle}". Dial *384# to vote or visit baraza.app.`;
        break;

      case 'payment_confirmed':
        message = `Baraza: Payment of KES ${event.amountKes} confirmed for ${event.communityName}. Your membership is active. Visit baraza.app.`;
        break;
    }

    const result = await sendSms({ to: event.phone, message });
    if (!result.success && result.error !== 'AT_SMS_DISABLED') {
      console.warn('[baraza:notifications] SMS failed', { event: event.type, error: result.error });
    }
  } catch (err) {
    console.error('[baraza:notifications] Unexpected error dispatching notification', err);
  }
}
