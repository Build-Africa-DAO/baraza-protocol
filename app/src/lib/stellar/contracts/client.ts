/**
 * Low-level Soroban contract invoker.
 * Wraps @stellar/stellar-sdk's SorobanRpc + TransactionBuilder into a single
 * `invokeContract` helper used by all typed contract clients.
 */

import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  xdr,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
} from '@stellar/stellar-sdk';

export type StellarEnv = 'testnet' | 'mainnet';

export interface ContractClientConfig {
  contractId: string;
  env: StellarEnv;
  /** Stellar secret key of the transaction signer (server-side only). */
  signerSecret: string;
}

const RPC_URLS: Record<StellarEnv, string> = {
  testnet: 'https://soroban-testnet.stellar.org',
  mainnet: 'https://soroban-mainnet.stellar.org',
};

const NETWORK_PASSPHRASES: Record<StellarEnv, string> = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
};

export async function invokeContract<T = unknown>(
  config: ContractClientConfig,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<T> {
  const server = new SorobanRpc.Server(RPC_URLS[config.env]);
  const keypair = Keypair.fromSecret(config.signerSecret);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(config.contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASES[config.env],
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(keypair);

  const sendResult = await server.sendTransaction(preparedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error(`Send failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  // Poll for confirmation
  let getResult: SorobanRpc.Api.GetTransactionResponse;
  do {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await server.getTransaction(sendResult.hash);
  } while (getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND);

  if (getResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    throw new Error(`Transaction failed: ${getResult.resultXdr}`);
  }

  const returnVal = (getResult as SorobanRpc.Api.GetSuccessfulTransactionResponse).returnValue;
  return (returnVal ? scValToNative(returnVal) : undefined) as T;
}

/** Helpers to convert JS values into xdr.ScVal arguments. */
export const arg = {
  address: (v: string) => nativeToScVal(v, { type: 'address' }),
  string: (v: string) => nativeToScVal(v, { type: 'string' }),
  u64: (v: bigint | number) => nativeToScVal(BigInt(v), { type: 'u64' }),
  u32: (v: number) => nativeToScVal(v, { type: 'u32' }),
  i128: (v: bigint | number) => nativeToScVal(BigInt(v), { type: 'i128' }),
  bool: (v: boolean) => nativeToScVal(v, { type: 'bool' }),
  bytes32: (v: Uint8Array) => xdr.ScVal.scvBytes(v),
  option: (v: xdr.ScVal | null) =>
    v === null ? xdr.ScVal.scvVoid() : v,
};
