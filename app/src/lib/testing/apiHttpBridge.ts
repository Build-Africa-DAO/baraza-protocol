// app/src/lib/testing/apiHttpBridge.ts
// Subsystem: Real HTTP API Bridge for End-to-End Curl Testing
// Standard: S&P 500 Enterprise Fintech (RFC 7230 / Web Fetch Standard Adapter)

import http from 'node:http';
import { AddressInfo } from 'node:net';

// API Route Handlers
import handleHealthReady from '../../../api/health/ready.js';
import { POST as handleCommunitiesPost } from '../../../api/communities/index.js';
import handleExecute from '../../../api/governance/execute.js';
import handleSubmitLicense from '../../../api/compliance/sacco-license-submit.js';
import handleReviewLicense from '../../../api/compliance/sacco-license-review.js';
import handleComplianceStatus from '../../../api/compliance/status.js';
import handleMonitorCron from '../../../api/cron/monitor-compliance.js';
import handleMinisend from '../../../api/payments/minisend.js';
import handleMinisendWebhook from '../../../api/webhooks/minisend.js';
import handleKotaniWebhook from '../../../api/webhooks/kotani.js';
import handlePaystackWebhook from '../../../api/webhooks/paystack.js';
import handleClearingWebhook from '../../../api/webhooks/clearing.js';
import handleArtizenWebhook from '../../../api/webhooks/artizen.js';
import handleChat from '../../../api/agent/chat.js';

export interface ApiHttpBridgeInstance {
  server: http.Server;
  url: string;
  port: number;
  stop: () => Promise<void>;
}

export async function startApiHttpBridge(preferredPort = 4000): Promise<ApiHttpBridgeInstance> {
  const server = http.createServer(async (req, res) => {
    const rawChunks: Buffer[] = [];
    req.on('data', (chunk) => rawChunks.push(chunk));
    req.on('end', async () => {
      const rawBody = Buffer.concat(rawChunks);
      const urlStr = `http://${req.headers.host || '127.0.0.1'}${req.url || '/'}`;
      const parsedUrl = new URL(urlStr);
      const pathname = parsedUrl.pathname;

      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val) {
          if (Array.isArray(val)) {
            val.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, val);
          }
        }
      }

      const method = req.method || 'GET';
      const webReq = new Request(urlStr, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? rawBody : undefined,
      });

      let webRes: Response | null = null;

      try {
        if (pathname === '/api/health/ready') {
          webRes = await handleHealthReady(webReq);
        } else if (pathname === '/api/communities') {
          webRes = await handleCommunitiesPost(webReq);
        } else if (pathname === '/api/governance/execute') {
          webRes = await handleExecute(webReq);
        } else if (pathname === '/api/compliance/sacco-license-submit') {
          webRes = await handleSubmitLicense(webReq);
        } else if (pathname === '/api/compliance/sacco-license-review') {
          webRes = await handleReviewLicense(webReq);
        } else if (pathname === '/api/compliance/status') {
          webRes = await handleComplianceStatus(webReq);
        } else if (pathname === '/api/cron/monitor-compliance') {
          webRes = await handleMonitorCron(webReq);
        } else if (pathname === '/api/payments/minisend') {
          webRes = await handleMinisend(webReq);
        } else if (pathname === '/api/webhooks/minisend') {
          webRes = await handleMinisendWebhook(webReq);
        } else if (pathname === '/api/webhooks/kotani') {
          webRes = await handleKotaniWebhook(webReq);
        } else if (pathname === '/api/webhooks/paystack') {
          webRes = await handlePaystackWebhook(webReq);
        } else if (pathname === '/api/webhooks/clearing') {
          webRes = await handleClearingWebhook(webReq);
        } else if (pathname === '/api/webhooks/artizen') {
          webRes = await handleArtizenWebhook(webReq);
        } else if (pathname === '/api/agent/chat') {
          webRes = await handleChat(webReq);
        } else {
          webRes = new Response(JSON.stringify({ error: 'not_found', pathname }), {
            status: 404,
            headers: { 'content-type': 'application/json' },
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        webRes = new Response(JSON.stringify({ error: 'internal_error', message }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }

      res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));
      const resBuf = Buffer.from(await webRes.arrayBuffer());
      res.end(resBuf);
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(preferredPort, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  const addr = server.address() as AddressInfo;
  const port = addr.port;
  const url = `http://127.0.0.1:${port}`;

  return {
    server,
    url,
    port,
    stop: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
