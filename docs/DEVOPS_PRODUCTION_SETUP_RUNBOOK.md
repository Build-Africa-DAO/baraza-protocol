# Baraza Protocol: DevOps Production Setup & Credentials Master Runbook
**Document Reference:** `BRZ-DEVOPS-RUNBOOK-2026-V1.0`  
**Classification:** Enterprise S&P 500 Infrastructure & Operational Runbook  
**Lead Author:** Simon Wandera, Systems Architect & Lead Backend Engineer  
**Governing Specifications:**  
- Software Architecture Document (SAD v1.0)  
- CR-007 Multi-Wallet & Custodial Clearing Addendum (v1.2)  
- Master Architecture Compendium (v2.0)  
- Cloudflare Infrastructure Architecture (`BARAZA-CF-INFRA-OFFICIAL-V1.0`)  
- NIST SP 800-53 Rev. 5 / PCI-DSS v4.0.1 / RFC 6234 / SASRA Cap 490B  

---

## 1. Executive Topology & Architecture Overview

Baraza Protocol operates across a multi-tier, hybrid edge infrastructure combining **Cloudflare Global Anycast Edge (Nairobi NBO, Mombasa MBA, Johannesburg JNB, Lagos LOS PoPs)**, **Managed Relational Persistence (Supabase PostgreSQL 16 with PgBouncer)**, **Decentralized Settlement Ledgers (Stellar Soroban & Base L2 Safe Multisigs)**, and **Direct African Mobile Financial Rails (Safaricom M-Pesa Daraja 3.0, Minisend, Kotani Pay, Africa's Talking, Evolution WhatsApp Gateway)**.

```
                                  CLOUDFLARE EDGE (DNS, WAF, PAGES & WORKERS)
                                    Domains: barazaprotocol.com | www | api
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
             Cloudflare Workers Assets      Edge Functions Router            Cloudflare Queues
            (React 18 Vite SPA)          (app/functions/api/[[catchall]])     (Zero-Loss Webhooks)
            • Unmetered Egress           • 70 Mounted API Routes              • Invariant I2b FIFO
            • Brotli Compression         • Web Crypto HMAC (sub-5ms)          • Dead-Letter Queue
            • Early Hints (_headers)     • Dynamic CORS (Vary: Origin)        • Rate Limiting
                       │                              │                              │
                       │                              ▼                              │
                       │                    PostgreSQL Connection Pool               │
                       │                 (Supabase / PgBouncer / Hyperdrive)         │
                       │                  Port 5432 / 6543 | Migrations 000-043      │
                       │                              │                              │
                       └──────────────────────────────┼──────────────────────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
             Web3 Settlement Rails            African Telecom Rails             AI & Sovereign Bots
           • Stellar Soroban RPC          • Safaricom Daraja 3.0 B2C/C2B     • Anthropic Claude 3.5
             (treasury_vault, governance) • Minisend B2C Off-Ramp            • Evolution API (Docker)
           • Base L2 (Safe 1.4.1)         • Kotani Pay Crypto Bridge         • Redis 7 (Socket & FSM)
           • Privy Non-Custodial MPC      • Africa's Talking (USSD/SMS)      • SendGrid (Transactional)
```

---

## 2. Master Third-Party Service Provisioning Inventory

Before deploying production services, DevOps must provision and configure the following 15 accounts:

| # | Provider / Service | Tier / Plan | Purpose in Protocol | Dashboard / Console Link | Status |
| :- | :--- | :---: | :--- | :--- | :---: |
| **1** | **Cloudflare** | Free / Standard | Apex DNS, WAF, Workers Static Assets, Edge Functions, Email Routing | [dash.cloudflare.com](https://dash.cloudflare.com) | **✅ LIVE** (`barazaprotocol.com`, `www`) |
| **2** | **Supabase** | Free Tier (`eu-west-1`) | PostgreSQL 16 Managed DB (`jwoibelpyvemhzazccym`), 39 Tables, RLS Enabled, PostgREST | [app.supabase.com](https://app.supabase.com) | **✅ LIVE & MIGRATED** (Migrations 000–043 Applied & Certified) |
| **3** | **Safaricom Daraja** | Production Go-Live | Inbound M-Pesa STK Push, C2B Paybill, B2C Disbursal, Status Queries | [developer.safaricom.co.ke](https://developer.safaricom.co.ke) | `[ ] PENDING` |
| **4** | **Minisend** | Production Enterprise | USDC-to-M-Pesa B2C instant settlement off-ramp | [minisend.xyz](https://minisend.xyz) | `[ ] PENDING` |
| **5** | **Kotani Pay** | Production | Multi-rail crypto-to-fiat bridge & IPN callbacks | [kotanipay.com](https://kotanipay.com) | `[ ] PENDING` |
| **6** | **Africa's Talking** | Production Prepaid | USSD Gateway (`*384*...#`), High-throughput SMS OTP, Alphanumeric Sender ID | [account.africastalking.com](https://account.africastalking.com) | `[ ] PENDING` |
| **7** | **Paystack** | Live Merchant | Card & International Bank Ingress | [dashboard.paystack.com](https://dashboard.paystack.com) | `[ ] PENDING` |
| **8** | **Privy** | Growth / Dev Plan | Embedded Web3 non-custodial MPC wallet generation & phone OTP | [dashboard.privy.io](https://dashboard.privy.io) | `[ ] PENDING` |
| **9** | **Stellar Horizon / RPC** | Dedicated / Gateway.fm | Soroban RPC mainnet queries, ledger ingestion, sequence synchronization | [stellar.org](https://stellar.org) | `[ ] PENDING` |
| **10**| **Base L2 / Alchemy** | Growth Plan | Base EVM Mainnet RPC & Gnosis Safe 1.4.1 execution | [alchemy.com](https://alchemy.com) | `[ ] PENDING` |
| **11**| **Anthropic** | Commercial API | Claude 3.5 Sonnet token inference for Akili AI Copilot & legal filings | [console.anthropic.com](https://console.anthropic.com) | `[ ] PENDING` |
| **12**| **Google Cloud Platform**| Free / Standard | Google Identity Services OAuth 2.0 Web Client for Sign-In with Google | [console.cloud.google.com](https://console.cloud.google.com) | `[ ] PENDING` |
| **13**| **SendGrid (Twilio)** | Essentials ($19/mo) | Domain-authenticated transactional email delivery (`no-reply@barazaprotocol.com`) | [app.sendgrid.com](https://app.sendgrid.com) | `[ ] PENDING` |
| **14**| **Upstash / Redis** | Free Tier (10k cmds/day) | Distributed leaky-bucket rate limiter, payout mutex locks, bot state caching | [console.upstash.com](https://console.upstash.com) | **✅ LIVE & CERTIFIED** (`baraza-redis-prod` in `eu-west-1`) |
| **15**| **WalletConnect Cloud** | Free / Standard | AppKit / Web3Modal project ID for multi-wallet mobile deep linking | [cloud.walletconnect.com](https://cloud.walletconnect.com) | `[ ] PENDING` |

---

## 3. Master Production Environment Variables & Secrets Matrix

All production secrets must be populated in **Cloudflare Workers/Pages → Settings → Environment Variables** (for runtime) and in **GitHub Repository Secrets** (for CI/CD).

### 3.1 Client-Side Variables (`VITE_` Prefix — Bundled at Build Time)

> [!CAUTION]
> These values are baked into the static JavaScript bundle and visible to anyone inspecting the browser. **NEVER** place server secrets, service role keys, or private keys in this section.

| Variable Name | Required | Default / Example Value | Description & Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_SITE_URL` | **YES** | `https://barazaprotocol.com` | Canonical public URL used for SEO, OpenGraph, and OAuth redirects. |
| `VITE_API_BASE` | NO | `""` *(empty for same-origin)* | Set to `https://api.barazaprotocol.com` if using a separate API subdomain. |
| `VITE_AUTH_PROVIDER` | **YES** | `privy` (or `baraza`) | Primary auth strategy: `privy` (embedded MPC) or `baraza` (custom session). |
| `VITE_SUPABASE_URL` | **YES** | `https://<ref>.supabase.co` | Public Supabase project API gateway. |
| `VITE_SUPABASE_ANON_KEY` | **YES** | `eyJhbGciOi...` | Supabase Anonymous JWT Key (RLS-enforced). |
| `VITE_PRIVY_APP_ID` | **YES** | `cm7...` | Privy App ID from Privy Dashboard. |
| `VITE_PRIVY_PHONE_AUTH_ENABLED` | NO | `true` | Enables Kenyan phone OTP login inside Privy modal. |
| `VITE_GOOGLE_CLIENT_ID` | NO | `<id>.apps.googleusercontent.com` | Google OAuth Client ID for custom Sign-In with Google. |
| `VITE_WALLETCONNECT_PROJECT_ID`| **YES** | `a1b2c3d4...` | WalletConnect Reown Project ID. |
| `VITE_VAPID_PUBLIC_KEY` | NO | `BNx...` | W3C Web Push VAPID Public Key for browser push notifications. |
| `VITE_STELLAR_NETWORK` | **YES** | `mainnet` | Target Stellar network (`mainnet` or `testnet`). |
| `VITE_STELLAR_HORIZON_URL` | **YES** | `https://horizon.stellar.org` | Public Stellar Horizon REST API. |
| `VITE_STELLAR_NETWORK_PASSPHRASE`| **YES**| `Public Global Stellar Network ; September 2015` | Canonical Stellar Mainnet passphrase. |
| `VITE_STELLAR_TREASURY_ACCOUNT`| **YES**| `G...` | Primary community dues clearing G-Account on Stellar. |
| `VITE_BRZA_ISSUER_ADDRESS` | **YES** | `G...` | Stellar public key of the BRZA governance asset issuer. |
| `VITE_BRZA_DISTRIBUTOR_ADDRESS`| **YES**| `G...` | Stellar public key of the liquid BRZA distributor. |
| `VITE_STELLAR_TREASURY_VAULT_ID`| **YES**| `C...` (56 chars) | Soroban contract ID for `treasury_vault`. |
| `VITE_STELLAR_GOVERNANCE_ID` | **YES** | `C...` (56 chars) | Soroban contract ID for `governance`. |
| `VITE_STELLAR_MEMBERSHIP_ID` | **YES** | `C...` (56 chars) | Soroban contract ID for `membership`. |
| `VITE_STELLAR_COMMUNITY_REGISTRY_ID`| **YES**| `C...` (56 chars) | Soroban contract ID for `community_registry`. |
| `VITE_STELLAR_PAYMENT_ATTESTATION_ID`| **YES**| `C...` (56 chars) | Soroban contract ID for `payment_attestation`. |
| `VITE_BASE_MANAGER_ADDRESS` | NO | `0x3ac0e64fe2931f8e082c6bb29283540de9b5371c` | Base mainnet Baraza Manager factory address. |
| `VITE_BASE_TESTNET` | **YES** | `false` | Set to `false` for Base mainnet (Chain ID 8453). |
| `VITE_ADMIN_WALLETS` | **YES** | `G...,0x...` | Comma-delimited list of system architect and root admin wallets. |

---

## 4. DNS, Domains & Cloudflare Network Routing

### 4.1 DNS Zone Configuration (`barazaprotocol.com`)

Configured records in Cloudflare DNS:

```dns
# Cloudflare Workers Managed Custom Domains (Auto-provisioned & active)
barazaprotocol.com         -> Cloudflare Workers Static Assets (Production)
www.barazaprotocol.com     -> Cloudflare Workers Static Assets (Production)

# Email Routing & Deliverability (Active)
MX       barazaprotocol.com route1.mx.cloudflare.net (Priority 75)
MX       barazaprotocol.com route2.mx.cloudflare.net (Priority 59)
MX       barazaprotocol.com route3.mx.cloudflare.net (Priority 94)
TXT      barazaprotocol.com "v=spf1 include:_spf.mx.cloudflare.net ~all"
TXT      cf2024-1._domainkey.barazaprotocol.com "v=DKIM1; h=sha256; k=rsa; p=..."
```

### 4.2 Cloudflare Workers & Static Assets Configuration

The project is configured via [`wrangler.toml`](file:///home/nothim/HIM/baraza-work/baraza-protocol/wrangler.toml) with Cloudflare Workers Static Assets:

```toml
name = "baraza-protocol"
compatibility_date = "2026-08-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "app/dist"

[env.preview.assets]
directory = "app/dist"

[env.production.assets]
directory = "app/dist"
```

* **Build Command**: `cd app && npm install && npm run build`
* **Deploy Command**: `npx wrangler deploy` (or `npx wrangler versions upload --env=""`)
* **Assets Read**: 402 files bundled into `app/dist` (Vite v8.2.1).

---

## 5. PostgreSQL Database & Persistence Setup Runbook

### 5.1 Migration Execution Runbook
All 42 migrations (000 to 043) must be applied sequentially via the migration engine:

```bash
# Execute against live Supabase instance:
DATABASE_URL="postgres://postgres.[ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" node scripts/devops/migrate-database.mjs

# Verify with dry-run mode anytime:
node scripts/devops/migrate-database.mjs --dry-run
```

**Canonical Migration Sequence (000 to 043):**
- `000` to `002`: Base communities and payment orders schema
- `003` to `005`: Payment attestations, durable memberships, and Stellar settlements
- `006` to `016`: Bounties, EVM community rails, RLS policies, and duplicate vote blocks
- `017` to `024`: Payment order metadata, USSD monitoring, Retro rounds, and dynamic activation fees
- `026` to `028`: Leverage foundation, double-entry `journal_entries`, and proposal escrow snapshots
- `029` to `031`: Minisend disbursements, SACCO compliance, and 3-way treasury reconciliation
- `032` to `039`: SaaS user profiles, web push subscriptions, CR-007 multi-wallet tables, DLQ exceptions, and custom auth sessions
- `040_reconcile_schema_fractures.sql`: Immutability trigger on `journal_entries`, bidirectional membership sync
- `041_auth_salt_and_bot_sessions.sql`: 256-bit password salts, bot FSM state persistence
- `042_system_config_and_circuit_breaker.sql`: Emergency circuit breaker tables and system parameters
- `043_community_image_url.sql`: Community image URL and brand asset columns

---

## 6. Pre-Beta DevOps Go-Live Checklist & Current Progress

```
[x] PHASE 0: ACCOUNTS, DOMAIN & FOUNDATIONS
    [x] 1. Cloudflare zone barazaprotocol.com active with DNSSEC enabled.
    [x] 2. SSL/TLS encryption mode verified active (HTTP/2 200).
    [x] 3. Cloudflare Workers project baraza-protocol deployed with static assets.
    [x] 4. Corporate email routing active (devops@barazaprotocol.com -> buildadao@gmail.com).
    [x] 5. Apex and www custom domains live (barazaprotocol.com, www.barazaprotocol.com).
    [x] 6. Supabase PostgreSQL 16 project provisioned (jwoibelpyvemhzazccym in eu-west-1).
    [x] 7. 42 sequential SQL migrations certified in dry-run mode.

[x] PHASE 0B: PRODUCTION DATABASE MIGRATION EXECUTION
    [x] 8. Execute consolidated_schema.sql on live Supabase instance: all 39 tables created, RLS enabled, atomic saga stored procedures compiled, storage buckets initialized, and circuit breaker active.

[ ] PHASE 1: FREE DEVELOPER INTEGRATION SERVICES (PROGRESSIVE ONBOARDING)
    [x] 9. Wire live Supabase credentials (VITE_SUPABASE_URL & anon key) into app production environment & Cloudflare runtime.
    [x] 10. Upstash Redis Free instance created and certified for distributed token-bucket rate limiting.
    [ ] 11. Google Cloud Console OAuth 2.0 Web Client ID generated (Sign-In with Google).
    [ ] 12. Privy Free Developer App ID configured for embedded MPC wallets.
    [ ] 13. WalletConnect Reown Project ID generated for mobile Web3 deep linking.
```

---
*Authored and Certified by Simon Wandera, Systems Architect & Lead Backend Engineer.*
