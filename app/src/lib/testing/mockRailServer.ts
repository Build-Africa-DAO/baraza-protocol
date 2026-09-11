/**
 * Multi-Rail Dependency Emulator Server for Baraza Protocol
 *
 * Emulates external payment rails, telecom gateways, and blockchain nodes:
 * 1. Safaricom Daraja (M-Pesa OAuth, STK Push, B2C Payouts)
 * 2. Kotani Pay (On-ramp, Off-ramp, signed webhooks)
 * 3. Minisend (B2C Off-ramp disbursement engine)
 * 4. Paystack (Card/Bank charge initialization & webhooks)
 * 5. Africa's Talking (SMS delivery gateway)
 * 6. Stellar Horizon (Account balance, sequence number, and transaction submission)
 *
 * Includes S&P 500 Enterprise Chaos Engineering Engine:
 * - Deterministic / probabilistic fault injection (500, 502, 503, 429)
 * - Network latency jitter simulation ([min, max] ms)
 * - Abrupt socket termination / connection drop simulation
 * - Active asynchronous telco callback dispatch engine
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { AddressInfo } from 'node:net';

export interface ChaosConfig {
  enabled: boolean;
  failureRate?: number; // 0.0 to 1.0
  statusCode?: number; // 500, 502, 503, 504, 429
  errorPayload?: unknown;
  latencyJitterMs?: [number, number]; // [min, max] delay
  dropConnection?: boolean; // destroy socket immediately
  insufficientFloat?: boolean;
}

export interface MockRailServerInstance {
  server: http.Server;
  url: string;
  port: number;
  stop: () => Promise<void>;
  setChaos: (config: Partial<ChaosConfig>) => void;
  clearChaos: () => void;
  generateKotaniSignature: (payload: unknown, secret: string) => string;
  generatePaystackSignature: (payload: unknown, secret: string) => string;
  generateMinisendSignature: (payload: unknown, secret: string) => string;
  generateSwyptSignature: (payload: unknown, secret: string) => string;
  generatePrivyToken: (did: string, appId?: string) => string;
  triggerAsyncWebhook: (
    targetUrl: string,
    payload: unknown,
    secret: string,
    provider?: 'kotani' | 'minisend' | 'paystack' | 'swypt',
    delayMs?: number,
  ) => Promise<Response>;
}

export async function startMockRailServer(preferredPort = 0): Promise<MockRailServerInstance> {
  let currentChaos: ChaosConfig = { enabled: false };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method?.toUpperCase() || 'GET';

    // -------------------------------------------------------------------------
    // 0. S&P 500 Chaos Engineering & Fault Injection Pipeline
    // -------------------------------------------------------------------------
    if (currentChaos.enabled && method !== 'OPTIONS') {
      // 0a. Latency Jitter Injection
      if (currentChaos.latencyJitterMs) {
        const [min, max] = currentChaos.latencyJitterMs;
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // 0b. Connection Drop / Socket Abrupt Reset
      if (currentChaos.dropConnection) {
        req.socket.destroy();
        return;
      }

      // 0c. Telco / Liquidity Float Exhaustion
      if (currentChaos.insufficientFloat) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'INSUFFICIENT_FLOAT',
          message: 'Upstream liquidity float depleted for carrier rail',
          code: 'FLOAT_EXHAUSTED_5001',
        }));
        return;
      }

      const shouldFail = (currentChaos.statusCode !== undefined || currentChaos.failureRate !== undefined)
        ? (currentChaos.failureRate !== undefined ? Math.random() < currentChaos.failureRate : true)
        : false;

      if (shouldFail) {
        const status = currentChaos.statusCode || 503;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (status === 429) {
          headers['Retry-After'] = '2';
          headers['X-RateLimit-Limit'] = '100';
          headers['X-RateLimit-Remaining'] = '0';
        }
        res.writeHead(status, headers);
        res.end(JSON.stringify(
          currentChaos.errorPayload || {
            error: 'upstream_service_unavailable',
            message: 'Upstream payment rail gateway temporarily unavailable',
            retryable: true,
          },
        ));
        return;
      }
    }

    // Read body if POST/PUT/PATCH
    let bodyText = '';
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      bodyText = Buffer.concat(chunks).toString('utf-8');
    }

    let parsedBody: Record<string, unknown> = {};
    if (bodyText) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        // Leave as empty or urlencoded
      }
    }

    const sendJson = (status: number, data: unknown, extraHeaders: Record<string, string> = {}) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        ...extraHeaders,
      });
      res.end(JSON.stringify(data));
    };

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      });
      res.end();
      return;
    }

    // -------------------------------------------------------------------------
    // 1. Safaricom Daraja / M-Pesa Rails
    // -------------------------------------------------------------------------
    if (pathname.includes('/oauth/v1/generate')) {
      sendJson(200, {
        access_token: 'daraja_mock_token_' + crypto.randomBytes(16).toString('hex'),
        expires_in: '3599',
      });
      return;
    }

    if (pathname.includes('/mpesa/stkpush/v1/processrequest')) {
      const checkoutId = 'ws_CO_MOCK_' + Date.now();
      const merchantId = 'merch_' + Date.now();

      // Automated asynchronous telco callback dispatch if CallBackURL provided
      if (typeof parsedBody.CallBackURL === 'string' && parsedBody.CallBackURL.startsWith('http')) {
        const callbackUrl = parsedBody.CallBackURL;
        const isFailure = parsedBody.simulateUserCancel === true;
        const callbackPayload = {
          Body: {
            stkCallback: {
              MerchantRequestID: merchantId,
              CheckoutRequestID: checkoutId,
              ResultCode: isFailure ? 1032 : 0,
              ResultDesc: isFailure ? 'Request cancelled by user' : 'The service request is processed successfully.',
              CallbackMetadata: isFailure ? undefined : {
                Item: [
                  { Name: 'Amount', Value: parsedBody.Amount || 1500 },
                  { Name: 'MpesaReceiptNumber', Value: 'QWE' + Date.now().toString().slice(-7) },
                  { Name: 'TransactionDate', Value: Number(new Date().toISOString().replace(/\D/g, '').slice(0, 14)) },
                  { Name: 'PhoneNumber', Value: parsedBody.PhoneNumber || 254712345678 },
                ],
              },
            },
          },
        };

        const delay = typeof parsedBody.callbackDelayMs === 'number' ? parsedBody.callbackDelayMs : 50;
        setTimeout(() => {
          fetch(callbackUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(callbackPayload),
          }).catch(() => {});
        }, delay);
      }

      sendJson(200, {
        MerchantRequestID: merchantId,
        CheckoutRequestID: checkoutId,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted for processing',
      });
      return;
    }

    if (pathname.includes('/mpesa/b2c/v1/paymentrequest')) {
      sendJson(200, {
        ConversationID: 'AG_MOCK_' + Date.now(),
        OriginatorConversationID: 'ORIG_MOCK_' + Date.now(),
        ResponseCode: '0',
        ResponseDescription: 'Accept the service request successfully.',
      });
      return;
    }

    if (pathname.includes('/mpesa/transactionstatus/v1/query')) {
      const transactionId = typeof parsedBody.TransactionID === 'string' ? parsedBody.TransactionID : 'ws_MOCK_' + Date.now();
      const conversationId = 'AG_STATUS_' + Date.now();
      const origConversationId = 'ORIG_STATUS_' + Date.now();

      // Dispatch asynchronous status callback if ResultURL provided
      if (typeof parsedBody.ResultURL === 'string' && parsedBody.ResultURL.startsWith('http')) {
        const resultUrl = parsedBody.ResultURL;
        const callbackPayload = {
          Result: {
            ResultType: 0,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            OriginatorConversationID: origConversationId,
            ConversationID: conversationId,
            TransactionID: transactionId,
            ResultParameters: {
              ResultParameter: [
                { Key: 'ReceiptNo', Value: transactionId },
                { Key: 'ConversationID', Value: conversationId },
                { Key: 'FinalisedTime', Value: Number(new Date().toISOString().replace(/\D/g, '').slice(0, 14)) },
                { Key: 'Amount', Value: 1500 },
                { Key: 'TransactionStatus', Value: 'Completed' },
              ],
            },
          },
        };
        setTimeout(() => {
          fetch(resultUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(callbackPayload),
          }).catch(() => {});
        }, 50);
      }

      sendJson(200, {
        ResponseCode: '0',
        ResponseDescription: 'The service request is processed successfully.',
        ConversationID: conversationId,
        OriginatorConversationID: origConversationId,
        ResultCode: '0',
        ResultDesc: 'The service request is processed successfully.',
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 2. Kotani Pay Rails
    // -------------------------------------------------------------------------
    if (pathname.startsWith('/api/v1/initiate') || pathname.startsWith('/api/v1/payments')) {
      sendJson(200, {
        status: 'PENDING',
        reference: 'kotani_ref_' + Date.now(),
        amount: parsedBody.amount || 1000,
        currency: parsedBody.currency || 'KES',
      });
      return;
    }

    if (pathname.startsWith('/api/v1/withdraw')) {
      sendJson(200, {
        status: 'SUCCESS',
        transaction_id: 'kotani_tx_' + Date.now(),
        message: 'Withdrawal initiated successfully',
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 3. Minisend B2C Rails
    // -------------------------------------------------------------------------
    if (pathname.startsWith('/api/v1/payout')) {
      sendJson(200, {
        success: true,
        payout_id: 'ms_payout_' + Date.now(),
        status: 'PROCESSING',
        fee_minor: 1500,
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 4. Paystack Rails
    // -------------------------------------------------------------------------
    if (pathname.startsWith('/transaction/initialize')) {
      sendJson(200, {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://checkout.paystack.com/mock_auth_' + Date.now(),
          access_code: 'access_' + Date.now(),
          reference: 'pstk_ref_' + Date.now(),
        },
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 5. Africa's Talking Rails
    // -------------------------------------------------------------------------
    if (pathname.includes('/version1/messaging')) {
      sendJson(200, {
        SMSMessageData: {
          Message: 'Sent to 1/1 Total Cost: KES 0.8000',
          Recipients: [
            {
              cost: 'KES 0.8000',
              messageId: 'ATXid_' + Date.now(),
              number: '+254712345678',
              status: 'Success',
              statusCode: 101,
            },
          ],
        },
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 6. Stellar Horizon & Soroban RPC Simulator
    // -------------------------------------------------------------------------
    if (pathname.startsWith('/accounts/')) {
      const accountId = pathname.split('/accounts/')[1]?.split('/')[0] || 'GA_MOCK';
      sendJson(200, {
        id: accountId,
        account_id: accountId,
        sequence: '1234567890',
        subentry_count: 2,
        balances: [
          {
            asset_type: 'native',
            balance: '1000.0000000',
          },
          {
            asset_type: 'credit_alphanum4',
            asset_code: 'BRZA',
            asset_issuer: 'GBRAZAPROTOCOLMINT1234567890123456789012345678901234567890',
            balance: '50000.0000000',
          },
          {
            asset_type: 'credit_alphanum4',
            asset_code: 'USDC',
            asset_issuer: 'GBUSDCISSUER123456789012345678901234567890123456789012345678',
            balance: '10000.0000000',
          },
        ],
        signers: [
          {
            key: accountId,
            weight: 1,
            type: 'ed25519_public_key',
          },
        ],
      });
      return;
    }

    if (pathname === '/transactions' && method === 'POST') {
      sendJson(200, {
        successful: true,
        hash: crypto.randomBytes(32).toString('hex'),
        ledger: 987654,
        envelope_xdr: 'AAAAAg...',
        result_xdr: 'AAAAAAAAAGQ...',
      });
      return;
    }

    if (pathname === '/fee_stats') {
      sendJson(200, {
        last_ledger: '987654',
        fee_charged: {
          max: '100',
          min: '100',
          mode: '100',
          p10: '100',
          p20: '100',
          p30: '100',
          p40: '100',
          p50: '100',
          p60: '100',
          p70: '100',
          p80: '100',
          p90: '100',
          p95: '100',
          p99: '100',
        },
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 7. Swypt Custodial Escrow Rails
    // -------------------------------------------------------------------------
    if (pathname.startsWith('/v1/escrow/deposit')) {
      sendJson(200, {
        ok: true,
        status: 'SETTLED',
        external_ref: 'swypt_ext_' + Date.now(),
        fee_minor: '500',
        order_id: parsedBody.order_id || 'ord_mock',
      });
      return;
    }

    if (pathname.startsWith('/v1/escrow/disburse')) {
      sendJson(200, {
        ok: true,
        status: 'SETTLED',
        external_ref: 'swypt_disb_' + Date.now(),
        disbursement_id: parsedBody.disbursement_id || 'disb_mock',
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 8. Base EVM & Gnosis Safe JSON-RPC Simulator
    // -------------------------------------------------------------------------
    if (pathname === '/rpc' || parsedBody.jsonrpc === '2.0') {
      const id = parsedBody.id ?? 1;
      const rpcMethod = parsedBody.method;

      if (rpcMethod === 'eth_chainId') {
        sendJson(200, { jsonrpc: '2.0', id, result: '0x2105' }); // Base Mainnet (8453)
        return;
      }
      if (rpcMethod === 'eth_blockNumber') {
        sendJson(200, { jsonrpc: '2.0', id, result: '0x10f4c20' }); // Block 17779744
        return;
      }
      if (rpcMethod === 'eth_getBalance') {
        sendJson(200, { jsonrpc: '2.0', id, result: '0xde0b6b3a7640000' }); // 1 ETH
        return;
      }
      if (rpcMethod === 'eth_call') {
        // Return 1 (true / active balance) as 32-byte word
        sendJson(200, { jsonrpc: '2.0', id, result: '0x0000000000000000000000000000000000000000000000000000000000000001' });
        return;
      }
      if (rpcMethod === 'eth_sendRawTransaction') {
        sendJson(200, { jsonrpc: '2.0', id, result: '0x' + crypto.randomBytes(32).toString('hex') });
        return;
      }
      if (rpcMethod === 'eth_getTransactionReceipt') {
        sendJson(200, {
          jsonrpc: '2.0',
          id,
          result: {
            status: '0x1',
            transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
            blockNumber: '0x10f4c20',
            confirmations: '0x5',
          },
        });
        return;
      }

      sendJson(200, { jsonrpc: '2.0', id, result: '0x0' });
      return;
    }

    // -------------------------------------------------------------------------
    // 9. Privy Auth JWKS & OIDC Discovery Rails
    // -------------------------------------------------------------------------
    if (pathname === '/.well-known/jwks.json' || pathname.includes('/jwks.json')) {
      sendJson(200, {
        keys: [
          {
            kty: 'RSA',
            kid: 'privy-mock-key-1',
            use: 'sig',
            alg: 'RS256',
            n: 'u1lK_mock_modulus_for_testing_purposes_only_1234567890',
            e: 'AQAB',
          },
        ],
      });
      return;
    }

    if (pathname.startsWith('/api/v1/users/')) {
      const did = pathname.replace('/api/v1/users/', '');
      sendJson(200, {
        id: did,
        created_at: Math.floor(Date.now() / 1000) - 86400,
        linked_accounts: [
          {
            type: 'wallet',
            address: '0x' + crypto.randomBytes(20).toString('hex'),
            chain_type: 'ethereum',
            verified_at: Math.floor(Date.now() / 1000),
          },
        ],
      });
      return;
    }

    // Evolution API Health Ping (Port 8080 simulation / alias)
    if (pathname === '/evolution-ping' || (pathname === '/' && req.headers.host?.includes('8080'))) {
      sendJson(200, { status: 200, message: 'Welcome to the Evolution API' });
      return;
    }

    // Default Fallback
    sendJson(200, { ok: true, message: 'Baraza Mock Rail Endpoint', pathname, method });
  });

  await new Promise<void>((resolve) => {
    server.listen(preferredPort, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as AddressInfo;
  const port = addr.port;
  const url = `http://127.0.0.1:${port}`;

  // Auxiliary Mock: Evolution WhatsApp API (Port 8080) for Scenario 100
  let evolutionServer: http.Server | null = null;
  if (preferredPort === 9099 || preferredPort === 8080) {
    try {
      const evo = http.createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 200, message: 'Welcome to the Evolution API' }));
      });
      await new Promise<void>((resolve) => {
        evo.listen(8080, '127.0.0.1', () => resolve());
        evo.on('error', () => resolve());
      });
      evolutionServer = evo;
    } catch {
      // Port 8080 already bound by external service
    }
  }

  const setChaos = (config: Partial<ChaosConfig>): void => {
    currentChaos = { ...currentChaos, ...config, enabled: config.enabled ?? true };
  };

  const clearChaos = (): void => {
    currentChaos = { enabled: false };
  };

  const generateKotaniSignature = (payload: unknown, secret: string): string => {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  };

  const generatePaystackSignature = (payload: unknown, secret: string): string => {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha512', secret).update(data).digest('hex');
  };

  const generateMinisendSignature = (payload: unknown, secret: string): string => {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  };

  const generateSwyptSignature = (payload: unknown, secret: string): string => {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  };

  const generatePrivyToken = (did: string, appId = 'mock-privy-app-id'): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'privy-mock-key-1' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: did,
        iss: 'privy.io',
        aud: appId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      })
    ).toString('base64url');
    const signature = crypto.createHmac('sha256', 'mock-privy-secret').update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${signature}`;
  };

  const triggerAsyncWebhook = async (
    targetUrl: string,
    payload: unknown,
    secret: string,
    provider: 'kotani' | 'minisend' | 'paystack' | 'swypt' = 'kotani',
    delayMs = 50,
  ): Promise<Response> => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const headers: Record<string, string> = { 'content-type': 'application/json' };

    if (provider === 'kotani') {
      headers['x-kotani-signature'] = generateKotaniSignature(rawBody, secret);
    } else if (provider === 'minisend') {
      headers['x-minisend-signature'] = generateMinisendSignature(rawBody, secret);
      headers['x-minisend-timestamp'] = Math.floor(Date.now() / 1000).toString();
    } else if (provider === 'paystack') {
      headers['x-paystack-signature'] = generatePaystackSignature(rawBody, secret);
    } else if (provider === 'swypt') {
      headers['x-swypt-signature'] = generateSwyptSignature(rawBody, secret);
    }

    return fetch(targetUrl, {
      method: 'POST',
      headers,
      body: rawBody,
    });
  };

  return {
    server,
    url,
    port,
    stop: async () => {
      if (evolutionServer) {
        await new Promise<void>((resolve) => {
          evolutionServer?.close(() => resolve());
        });
      }
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
    setChaos,
    clearChaos,
    generateKotaniSignature,
    generatePaystackSignature,
    generateMinisendSignature,
    generateSwyptSignature,
    generatePrivyToken,
    triggerAsyncWebhook,
  };
}
