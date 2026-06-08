import {
  Asset,
  Keypair,
  LiquidityPoolAsset,
  getLiquidityPoolId,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { BRZA_ASSET, STELLAR_ASSETS } from './constants';

const server = new Horizon.Server(BRZA_ASSET.horizonUrl);
const NETWORK = BRZA_ASSET.network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
const POOL_FEE = 30; // 0.3% in basis points (Stellar standard)

export function getBrzaUsdcPoolId(): string {
  const brzaAsset = new Asset(BRZA_ASSET.code, BRZA_ASSET.issuerAddress);
  const usdcAsset = new Asset('USDC', STELLAR_ASSETS.USDC.issuer);
  const poolAsset = new LiquidityPoolAsset(brzaAsset, usdcAsset, POOL_FEE);
  return getLiquidityPoolId('constant_product', poolAsset).toString('hex');
}

export async function depositLiquidity(params: {
  fundingSecret: string;
  brzaAmount: string;
  usdcAmount: string;
  maxPriceSlippage?: number;
}): Promise<{ txHash: string; poolSharesReceived: string; error?: string }> {
  try {
    const kp = Keypair.fromSecret(params.fundingSecret);
    const account = await server.loadAccount(kp.publicKey());
    const slippage = params.maxPriceSlippage ?? 0.01;

    const midPrice = parseFloat(params.usdcAmount) / parseFloat(params.brzaAmount);
    const minPrice = (midPrice * (1 - slippage)).toFixed(7);
    const maxPrice = (midPrice * (1 + slippage)).toFixed(7);

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(
        Operation.liquidityPoolDeposit({
          liquidityPoolId: getBrzaUsdcPoolId(),
          maxAmountA: params.brzaAmount,
          maxAmountB: params.usdcAmount,
          minPrice,
          maxPrice,
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(kp);
    const result = await server.submitTransaction(tx);
    return { txHash: result.hash, poolSharesReceived: '0' };
  } catch (e) {
    return { txHash: '', poolSharesReceived: '0', error: String(e) };
  }
}

export async function getPoolStats(): Promise<{
  brzaReserve: string;
  usdcReserve: string;
  totalShares: string;
  brzaPriceUsdc: number;
  tvlUsdc: number;
  error?: string;
}> {
  try {
    const poolId = getBrzaUsdcPoolId();
    const res = await fetch(`${BRZA_ASSET.horizonUrl}/liquidity_pools/${poolId}`);
    const data = await res.json() as {
      status?: number;
      reserves?: Array<{ asset: string; amount: string }>;
      total_shares?: string;
    };

    if (data.status === 404) {
      return { brzaReserve: '0', usdcReserve: '0', totalShares: '0', brzaPriceUsdc: 0, tvlUsdc: 0, error: 'Pool not yet created' };
    }

    const reserves = data.reserves ?? [];
    const brzaReserve = reserves.find((r) => r.asset.startsWith(BRZA_ASSET.code))?.amount ?? '0';
    const usdcReserve = reserves.find((r) => r.asset.startsWith('USDC'))?.amount ?? '0';
    const brzaFloat = parseFloat(brzaReserve);
    const usdcFloat = parseFloat(usdcReserve);
    const brzaPriceUsdc = brzaFloat > 0 ? usdcFloat / brzaFloat : 0;

    return {
      brzaReserve,
      usdcReserve,
      totalShares: data.total_shares ?? '0',
      brzaPriceUsdc,
      tvlUsdc: usdcFloat * 2,
    };
  } catch (e) {
    return { brzaReserve: '0', usdcReserve: '0', totalShares: '0', brzaPriceUsdc: 0, tvlUsdc: 0, error: String(e) };
  }
}
