// cloudflare/edgeRouter.ts
// Standard: S&P 500 Enterprise Fintech (Cloudflare Pages Functions & Worker Dispatch Router)
// Strict Zero-Any TypeScript Implementation

export type ApiHandler = (req: Request) => Promise<Response>;

// Static Route Dispatch Registry
import agentChat from '../app/api/agent/chat';
import akiliFilings from '../app/api/akili/filings';
import authGoogle from '../app/api/auth/google';
import authLogout from '../app/api/auth/logout';
import authMe from '../app/api/auth/me';
import authSigninRequest from '../app/api/auth/signin/request';
import authSignupRequest from '../app/api/auth/signup/request';
import authVerify from '../app/api/auth/verify';
import communitiesIndex from '../app/api/communities/index';
import communitiesInvitesAccept from '../app/api/communities/invites/accept';
import communitiesInvitesIndex from '../app/api/communities/invites/index';
import communitiesLogo from '../app/api/communities/logo';
import communitiesMembers from '../app/api/communities/members';
import communitiesOfficers from '../app/api/communities/officers';
import communitiesRetroAllocations from '../app/api/communities/retro-allocations';
import communitiesRetroBallot from '../app/api/communities/retro-ballot';
import communitiesRetroRounds from '../app/api/communities/retro-rounds';
import communitiesRetroSettle from '../app/api/communities/retro-settle';
import communitiesStatement from '../app/api/communities/statement';
import dynamicCommunityInvites from '../app/api/communities/[id]/invites';
import complianceLicenseReview from '../app/api/compliance/sacco-license-review';
import complianceLicenseSubmit from '../app/api/compliance/sacco-license-submit';
import complianceStatus from '../app/api/compliance/status';
import complianceTreasuryUnfreeze from '../app/api/compliance/treasury-unfreeze';
import cronMonitorCompliance from '../app/api/cron/monitor-compliance';
import { POST as cronPromoteOrders } from '../app/api/cron/promote-orders';
import cronReconcileTreasury from '../app/api/cron/reconcile-treasury';
import {
  GET as cronSettleRetroAllocationsGet,
  POST as cronSettleRetroAllocationsPost,
} from '../app/api/cron/settle-retro-allocations';
import governanceExecute from '../app/api/governance/execute';
import governanceFinalize from '../app/api/governance/finalize';
import governanceProposals from '../app/api/governance/proposals';
import governanceVote from '../app/api/governance/vote';
import healthLive from '../app/api/health/live';
import healthMetrics from '../app/api/health/metrics';
import healthReady from '../app/api/health/ready';
import identityInitiateClaim from '../app/api/identity/initiate-claim';
import identityVerifyClaim from '../app/api/identity/verify-claim';
import membershipActivate from '../app/api/membership/activate';
import mpesaSimulate from '../app/api/mpesa/simulate';
import mpesaStatusResult from '../app/api/mpesa/status-result';
import mpesaStatusTimeout from '../app/api/mpesa/status-timeout';
import mpesaStkPush from '../app/api/mpesa/stk-push';
import mpesaTransactionStatus from '../app/api/mpesa/transaction-status';
import paymentOrdersDispute from '../app/api/payment-orders/dispute';
import paymentOrdersStatus from '../app/api/payment-orders/status';
import paymentOrdersStreak from '../app/api/payment-orders/streak';
import paymentOrdersStreakBatch from '../app/api/payment-orders/streak-batch';
import paymentsAirtelStk from '../app/api/payments/airtel/stk';
import paymentsBrzaMembership from '../app/api/payments/brza-membership';
import paymentsCardCheckout from '../app/api/payments/card/checkout';
import paymentsExceptionsResolve from '../app/api/payments/exceptions/resolve';
import paymentsKotani from '../app/api/payments/kotani';
import paymentsMinisend from '../app/api/payments/minisend';
import paymentsPaystack from '../app/api/payments/paystack';
import paymentsQuote from '../app/api/payments/quote';
import paymentsReconcileBrzaMembership from '../app/api/payments/reconcile-brza-membership';
import stellarCreatePaymentIntent from '../app/api/stellar/create-payment-intent';
import { POST as stellarVerifyPayment } from '../app/api/stellar/verify-payment';
import treasuryInitialize from '../app/api/treasury/initialize';
import userAvatar from '../app/api/user/avatar';
import userMemberships from '../app/api/user/memberships';
import userPushSubscribe from '../app/api/user/notifications/push-subscribe';
import userProfile from '../app/api/user/profile';
import ussdIndex from '../app/api/ussd/index';
import webhooksAfricasTalking from '../app/api/webhooks/africastalking';
import webhooksArtizen from '../app/api/webhooks/artizen';
import webhooksClearing from '../app/api/webhooks/clearing';
import webhooksKotani from '../app/api/webhooks/kotani';
import webhooksMinisend from '../app/api/webhooks/minisend';
import webhooksPaystack from '../app/api/webhooks/paystack';
import webhooksWhatsapp from '../app/api/webhooks/whatsapp';

const cronSettleRetroAllocations: ApiHandler = (req) =>
  req.method === 'GET' ? cronSettleRetroAllocationsGet(req) : cronSettleRetroAllocationsPost(req);

export const routeTable: Record<string, ApiHandler> = {
  '/api/agent/chat': agentChat,
  '/api/akili/filings': akiliFilings,
  '/api/auth/google': authGoogle,
  '/api/auth/logout': authLogout,
  '/api/auth/me': authMe,
  '/api/auth/signin/request': authSigninRequest,
  '/api/auth/signup/request': authSignupRequest,
  '/api/auth/verify': authVerify,
  '/api/communities': communitiesIndex,
  '/api/communities/invites': communitiesInvitesIndex,
  '/api/communities/invites/accept': communitiesInvitesAccept,
  '/api/communities/logo': communitiesLogo,
  '/api/communities/members': communitiesMembers,
  '/api/communities/officers': communitiesOfficers,
  '/api/communities/retro-allocations': communitiesRetroAllocations,
  '/api/communities/retro-ballot': communitiesRetroBallot,
  '/api/communities/retro-rounds': communitiesRetroRounds,
  '/api/communities/retro-settle': communitiesRetroSettle,
  '/api/communities/statement': communitiesStatement,
  '/api/compliance/sacco-license-review': complianceLicenseReview,
  '/api/compliance/sacco-license-submit': complianceLicenseSubmit,
  '/api/compliance/status': complianceStatus,
  '/api/compliance/treasury-unfreeze': complianceTreasuryUnfreeze,
  '/api/cron/monitor-compliance': cronMonitorCompliance,
  '/api/cron/promote-orders': cronPromoteOrders,
  '/api/cron/reconcile-treasury': cronReconcileTreasury,
  '/api/cron/settle-retro-allocations': cronSettleRetroAllocations,
  '/api/governance/execute': governanceExecute,
  '/api/governance/finalize': governanceFinalize,
  '/api/governance/proposals': governanceProposals,
  '/api/governance/vote': governanceVote,
  '/api/health/live': healthLive,
  '/api/health/metrics': healthMetrics,
  '/api/health/ready': healthReady,
  '/api/identity/initiate-claim': identityInitiateClaim,
  '/api/identity/verify-claim': identityVerifyClaim,
  '/api/membership/activate': membershipActivate,
  '/api/mpesa/simulate': mpesaSimulate,
  '/api/mpesa/status-result': mpesaStatusResult,
  '/api/mpesa/status-timeout': mpesaStatusTimeout,
  '/api/mpesa/stk-push': mpesaStkPush,
  '/api/mpesa/transaction-status': mpesaTransactionStatus,
  '/api/payment-orders/dispute': paymentOrdersDispute,
  '/api/payment-orders/status': paymentOrdersStatus,
  '/api/payment-orders/streak': paymentOrdersStreak,
  '/api/payment-orders/streak-batch': paymentOrdersStreakBatch,
  '/api/payments/airtel/stk': paymentsAirtelStk,
  '/api/payments/brza-membership': paymentsBrzaMembership,
  '/api/payments/card/checkout': paymentsCardCheckout,
  '/api/payments/exceptions/resolve': paymentsExceptionsResolve,
  '/api/payments/kotani': paymentsKotani,
  '/api/payments/minisend': paymentsMinisend,
  '/api/payments/paystack': paymentsPaystack,
  '/api/payments/quote': paymentsQuote,
  '/api/payments/reconcile-brza-membership': paymentsReconcileBrzaMembership,
  '/api/stellar/create-payment-intent': stellarCreatePaymentIntent,
  '/api/stellar/verify-payment': stellarVerifyPayment,
  '/api/treasury/initialize': treasuryInitialize,
  '/api/user/avatar': userAvatar,
  '/api/user/memberships': userMemberships,
  '/api/user/notifications/push-subscribe': userPushSubscribe,
  '/api/user/profile': userProfile,
  '/api/ussd': ussdIndex,
  '/api/webhooks/africastalking': webhooksAfricasTalking,
  '/api/webhooks/artizen': webhooksArtizen,
  '/api/webhooks/clearing': webhooksClearing,
  '/api/webhooks/kotani': webhooksKotani,
  '/api/webhooks/minisend': webhooksMinisend,
  '/api/webhooks/paystack': webhooksPaystack,
  '/api/webhooks/whatsapp': webhooksWhatsapp,
};

/**
 * Normalizes incoming request pathname and matches against static and dynamic route tables.
 */
export async function dispatchApiRoute(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/$/, ''); // strip trailing slash

  // 1. Direct Static Route Match
  const staticHandler = routeTable[pathname];
  if (staticHandler) {
    return staticHandler(req);
  }

  // 2. Dynamic Route Pattern Match: /api/communities/:id/invites
  const dynamicInviteMatch = pathname.match(/^\/api\/communities\/([^/]+)\/invites$/);
  if (dynamicInviteMatch) {
    return dynamicCommunityInvites(req);
  }

  // 3. Dynamic Route Pattern Match: /api/communities/:id/logo
  const dynamicLogoMatch = pathname.match(/^\/api\/communities\/([^/]+)\/logo$/);
  if (dynamicLogoMatch) {
    return communitiesLogo(req);
  }

  // 4. Fallback 404 for unknown /api/* endpoints
  return new Response(
    JSON.stringify({
      error: 'not_found',
      message: `No API route registered for path: ${pathname}`,
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}
