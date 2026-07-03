import { assertGoodDollarReady, getGoodDollarConfig } from '@/lib/gooddollar/sdk';

export interface GoodDollarIdentityStatus {
  account: string;
  checked: boolean;
  whitelisted: boolean;
  reason?: string;
}

export async function checkGoodDollarIdentity(account: string): Promise<boolean> {
  const status = await getGoodDollarIdentityStatus(account);
  return status.whitelisted;
}

export async function getGoodDollarIdentityStatus(account: string): Promise<GoodDollarIdentityStatus> {
  const config = getGoodDollarConfig();
  if (!config.enabled) {
    return {
      account,
      checked: false,
      whitelisted: false,
      reason: 'GoodDollar Identity contract is not configured.',
    };
  }

  assertGoodDollarReady();
  return {
    account,
    checked: true,
    whitelisted: false,
    reason: 'GoodDollar Identity read is scaffolded; wire isWhitelisted once the ABI/address is confirmed.',
  };
}
