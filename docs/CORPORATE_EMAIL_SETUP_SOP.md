# Baraza Protocol: Corporate Email Setup & Security Hardening SOP

**Document Reference:** `BRZ-DEVOPS-EMAIL-SOP-2026-V1.0`  
**Classification:** DevOps Standard Operating Procedure (SOP) & Security Blueprint  
**Standard:** S&P 500 Enterprise Fintech / NIST SP 800-53 AC-2 / PCI-DSS v4.0.1 / CIS Controls  
**Target Domain:** `barazaprotocol.com`  
**Author:** Simon Wandera, Systems Architect & Lead DevOps Engineer  

---

## 1. Executive Architecture & Strategic Options

Because we already own the domain (`barazaprotocol.com`), we have two primary implementation paths depending on whether the company wants **native Google Workspace integration** or an **ultra-capital-efficient 100% free Cloudflare routing setup**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CHOOSE YOUR ARCHITECTURE                                │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ Option A: Google Workspace (Recommended)  │ Option B: Cloudflare Email Routing (100% $0)│
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Cost: $6.00 / month (Total!)            │ • Cost: $0.00 / month                      │
│ • Architecture: 1 paid seat + free groups │ • Architecture: Serverless DNS forwarding  │
│ • Native Google SSO, Drive, Meet, GCP     │ • Forwards devops@ directly to your inbox  │
│ • Professional corporate webmail (Gmail)  │ • SendGrid / Resend handles outbound mail  │
│ • Best for FinTech KYB & investor audits  │ • Best for zero-budget Phase 0 staging     │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

> [!TIP]
> **The $6/mo Cost-Optimization Secret for Google Workspace:**  
> You do **not** need to buy a $6/mo license for every role or team member. You buy **ONE single admin seat** (e.g. `admin@barazaprotocol.com` or `simon@barazaprotocol.com`), and then create **unlimited FREE Google Groups / Distribution Lists** (`devops@`, `finance@`, `security@`, `billing@`). Emails sent to those addresses are distributed to authorized members at **$0 additional cost**.

---

## 2. Option A: Google Workspace Step-by-Step Setup ($6/mo)

### Step 1: Sign Up & Register Domain
1. Navigate to [workspace.google.com](https://workspace.google.com).
2. Choose **Business Starter** ($6.00 / user / month).
3. Select **"Yes, I have one I can use"** and input `barazaprotocol.com`.
4. Create the primary administrator account (e.g., `admin@barazaprotocol.com` or `simon@barazaprotocol.com`).

---

### Step 2: Configure DNS Records in Cloudflare
Log into **Cloudflare Dashboard** ➔ Select `barazaprotocol.com` ➔ **DNS** ➔ **Records** ➔ Add the following:

#### A. MX Records (Inbound Mail Routing)
| Type | Name | Content / Mail Server | Priority | Proxy Status |
| :---: | :---: | :--- | :---: | :---: |
| **MX** | `@` | `SMTP.GOOGLE.COM` | `1` | DNS Only (Gray Cloud) |

*(Note: Google now uses the unified `SMTP.GOOGLE.COM` endpoint, or the traditional 5-record cluster `ASPMX.L.GOOGLE.COM`, `ALT1.ASPMX.L.GOOGLE.COM`, etc.).*

#### B. SPF Record (Anti-Spoofing & Sender Authentication)
Prevents malicious actors from impersonating `@barazaprotocol.com`:
| Type | Name | Content | TTL |
| :---: | :---: | :--- | :---: |
| **TXT** | `@` | `v=spf1 include:_spf.google.com ~all` | Auto |

*(If using SendGrid for transactional emails concurrently, update SPF to: `v=spf1 include:_spf.google.com include:sendgrid.net ~all`).*

#### C. DKIM Record (Cryptographic Signature Verification)
1. Go to **Google Admin Console** (`admin.google.com`) ➔ **Apps** ➔ **Google Workspace** ➔ **Gmail** ➔ **Authenticate email**.
2. Click **Generate new record** (Prefix selector: `google`, 2048-bit key).
3. Copy the generated TXT key and add to Cloudflare DNS:
| Type | Name | Content |
| :---: | :---: | :--- |
| **TXT** | `google._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...` |
4. Back in Google Admin Console, click **Start authentication**.

#### D. DMARC Record (Enforcement & Fraud Protection)
Guarantees compliance under PCI-DSS v4.0.1 and Google/Yahoo 2024+ sender requirements:
| Type | Name | Content |
| :---: | :---: | :--- |
| **TXT** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:security@barazaprotocol.com; pct=100; adkim=r; aspf=r` |

---

### Step 3: Create Role-Based Distribution Groups (Free!)
In **Google Admin Console** (`admin.google.com`) ➔ **Directory** ➔ **Groups** ➔ **Create group**:

1. **`devops@barazaprotocol.com`**
   * **Name:** Baraza DevOps & Infrastructure Team
   * **Access Type:** External allowed (so Cloudflare, Supabase, Hetzner, and GitHub can deliver verification emails).
   * **Members:** Add Simon Wandera and technical co-leads.
2. **`finance@barazaprotocol.com` (and alias `billing@barazaprotocol.com`)**
   * **Name:** Baraza Treasury & Accounting
   * **Access Type:** External allowed.
   * **Members:** Add Simon Wandera, Aziz, and Finance leads (receives Daraja STK alerts, Minisend receipts, Paystack invoices).
3. **`security@barazaprotocol.com`**
   * **Name:** Baraza Incident Response & Security
   * **Access Type:** External allowed.
   * **Members:** Security administrators (receives DMARC reports, bug bounty disclosures, and Privy alerts).

---

## 3. Option B: Cloudflare Email Routing Setup (100% Free / $0.00)

If you prefer **zero monthly recurring subscription costs**, Cloudflare provides native serverless email routing built into your DNS:

### Step 1: Enable Email Routing in Cloudflare
1. Go to **Cloudflare Dashboard** ➔ Select `barazaprotocol.com`.
2. In the sidebar, click **Email** ➔ **Email Routing**.
3. Click **Enable Email Routing**. Cloudflare will automatically add the required MX and SPF records to your DNS with a single click.

### Step 2: Create Custom Addresses & Forwarding Rules
Under **Email Routing** ➔ **Routing rules** ➔ **Create address**:

| Custom Email Address | Action | Destination Address |
| :--- | :--- | :--- |
| `devops@barazaprotocol.com` | Forward to | `simon.wandera@gmail.com` (and co-leads) |
| `finance@barazaprotocol.com` | Forward to | `aziz@...` and `simon.wandera@gmail.com` |
| `security@barazaprotocol.com`| Forward to | `simon.wandera@gmail.com` |

*Verification:* Cloudflare will send a verification link to each destination personal email. Once clicked, any email sent to `devops@barazaprotocol.com` lands instantly in your personal inbox!

---

## 4. Enterprise Security Hardening & Password Vault SOP

Under **NIST SP 800-53 (Access Control) & S&P 500 Enterprise Governance**, protect the master corporate accounts with these strict safeguards:

### 1. Mandatory Multi-Factor Authentication (MFA)
* Enforce **2-Step Verification** for all admin accounts.
* **Prohibited:** SMS 2FA (vulnerable to SIM swapping attacks).
* **Mandatory:** Hardware FIDO2 keys (YubiKey) or Time-Based One-Time Passwords (TOTP via 1Password / Bitwarden / Google Authenticator).

### 2. Centralized Team Credential Management (1Password / Bitwarden)
* Never send API tokens, database connection strings, or master passwords over WhatsApp, Telegram, or unencrypted Slack.
* Create a shared **"Baraza Core Infrastructure"** vault in 1Password or Bitwarden containing:
  * Master admin passwords.
  * Shared TOTP secret seeds (so multiple authorized engineers can generate 2FA codes without passing a physical phone).
  * Cloudflare, Supabase, and Daraja recovery emergency codes.

---

## 5. Verification & Health Check Runbook

Once DNS records are propagated (typically 5–15 minutes), execute the automated terminal verification check:

```bash
# 1. Verify MX Routing (Returns Google or Cloudflare MX servers)
dig +short MX barazaprotocol.com

# 2. Verify SPF Anti-Spoofing Policy
dig +short TXT barazaprotocol.com | grep "v=spf1"

# 3. Verify DMARC Fraud Protection
dig +short TXT _dmarc.barazaprotocol.com

# 4. Verify DKIM Cryptographic Key
dig +short TXT google._domainkey.barazaprotocol.com
```

### Expected Output:
```
v=spf1 include:_spf.google.com ~all
v=DMARC1; p=quarantine; rua=mailto:security@barazaprotocol.com; pct=100;
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8...
```

---

## 6. Immediate Action Checklist

- [ ] **Step 1:** Choose **Option A (Google Workspace $6/mo)** or **Option B (Cloudflare Email Routing $0/mo)**.
- [ ] **Step 2:** Add MX, SPF, DKIM, and DMARC records to Cloudflare DNS.
- [ ] **Step 3:** Provision `devops@barazaprotocol.com` and `finance@barazaprotocol.com`.
- [ ] **Step 4:** Send a test email from an external address to `devops@barazaprotocol.com` to confirm delivery.
- [ ] **Step 5:** Use `devops@barazaprotocol.com` to register the **Supabase** and **Cloudflare** production accounts.
