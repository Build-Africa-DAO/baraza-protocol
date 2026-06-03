import { arg, invokeContract, type ContractClientConfig } from './client';

export interface PaymentRecord {
  tx_hash: Uint8Array;
  community_id: string;
  /** Amount in stroops (1 XLM = 10_000_000). */
  amount: bigint;
  payer: string;
  ledger: number;
  attested_at: bigint;
}

export class PaymentAttestationClient {
  constructor(private readonly config: ContractClientConfig) {}

  /**
   * Record a verified Stellar payment on-chain.
   * `txHashHex` is the 64-char hex transaction hash from Horizon.
   */
  async attest(params: {
    txHashHex: string;
    communityId: string;
    amountStroops: bigint;
    payer: string;
    ledger: number;
  }): Promise<PaymentRecord> {
    const txHashBytes = hexToBytes32(params.txHashHex);
    return invokeContract<PaymentRecord>(this.config, 'attest', [
      arg.bytes32(txHashBytes),
      arg.string(params.communityId),
      arg.i128(params.amountStroops),
      arg.address(params.payer),
      arg.u32(params.ledger),
    ]);
  }

  async getPayment(txHashHex: string): Promise<PaymentRecord | null> {
    const txHashBytes = hexToBytes32(txHashHex);
    return invokeContract<PaymentRecord | null>(this.config, 'get_payment', [
      arg.bytes32(txHashBytes),
    ]);
  }

  async hasPayment(txHashHex: string): Promise<boolean> {
    const txHashBytes = hexToBytes32(txHashHex);
    return invokeContract<boolean>(this.config, 'has_payment', [
      arg.bytes32(txHashBytes),
    ]);
  }

  async admin(): Promise<string> {
    return invokeContract<string>(this.config, 'admin');
  }

  async setAdmin(newAdmin: string): Promise<void> {
    await invokeContract(this.config, 'set_admin', [arg.address(newAdmin)]);
  }

  async initialize(admin: string): Promise<void> {
    await invokeContract(this.config, 'initialize', [arg.address(admin)]);
  }
}

function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '').toLowerCase();
  if (clean.length !== 64) throw new Error('tx hash must be 64 hex characters');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
