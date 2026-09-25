# Baraza Protocol: Platform Status & Launch Readiness Memo

**To:** Board of Directors, Bad Dao Africa Limited  
**From:** Simon Wandera, Systems Architect & Backend Lead  
**Date:** September 24, 2026  
**Subject:** Current Platform Status, Infrastructure, and Partner Onboarding  
**Live Site:** [https://barazaprotocol.com](https://barazaprotocol.com)  

---

### 1. Where We Are Right Now (Summary)

The core software build is finished and deployed live at `https://barazaprotocol.com`. 

The web application, backend APIs, database, and smart contracts are fully wired together and operational. Our automated test suite (1,222 tests across 107 test files) is passing with zero errors.

We are now waiting on third-party commercial partners (payment gateways and telcos) to approve our accounts before we can start processing real money with our pilot communities.

---

### 2. What Is Working Today (Technical Stack)

* **Web App & APIs:** Live on Cloudflare Workers at `barazaprotocol.com`. Serving the React frontend and 56 backend API routes for groups, members, voting, and payments.
* **Database & Ledger:** Supabase PostgreSQL database is live with all 43 database updates applied. It includes a double-entry ledger that tracks group contributions, savings, and payouts.
* **Smart Contracts:** Deployed on Stellar for community treasury management and member records. Connected to Base (Ethereum Layer 2) for multisig security.
* **Automated Mobile Payouts (Minisend):** Working on Base mainnet. When a group approves a grant or payout, our system sends digital dollars (USDC) through Minisend, which deposits Kenyan Shillings (KES) directly into the member's M-Pesa phone number in seconds.
* **SMS & USSD:** Twilio and Africa's Talking are connected for phone login codes (OTPs) and handling basic USSD menus (`*384#`) for members without smartphones.

---

### 3. Payment Rails: Current Status & What We Are Waiting On

| Provider | What It Does | Current Status | What's Needed / Next Step |
| :--- | :--- | :---: | :--- |
| **Minisend** | Payouts: USDC $\to$ M-Pesa | **Live & Ready** | Fully working on Base mainnet. Tested and ready for production payouts. |
| **Paystack** | Card & Bank Inbound Payments | **Working in Test Mode**<br>*(Live keys pending)* | Integration and card checkout flows work. Business documents (KYB) were submitted. Waiting for Paystack compliance to approve our account so we can switch to live keys and accept real card payments. |
| **Kotani Pay** | M-Pesa $\leftrightarrow$ Stellar Bridge | **Waiting on Support** | Integration code is ready. We confirmed to Kotani that we are settling on Stellar (KES to Stellar USDC) and provided our monthly volume projections (KES 5M–10M/mo). Waiting for Kotani support to activate the KES wallet in our sandbox account so we can run test deposits. |
| **Africa's Talking** | SMS OTPs & USSD | **Live (Default Sender)**<br>*(Custom sender ID pending)* | Account is funded (KES 10 balance) and working. Standard SMS and USSD (`*384#`) work. Our custom sender name (`BarazaProto`) is waiting on carrier review by Safaricom and Airtel (Ticket: `ATPR-0005887`). |
| **Safaricom (Direct)** | Direct M-Pesa Paybill | **Not Started** | Requires a direct enterprise contract with Safaricom. Not blocking our launch because Minisend and Kotani handle our M-Pesa needs. Recommended for later to lower transaction fees. |

---

### 4. Financial Safety & Compliance Controls

* **Fund Segregation:** Community savings and member dues are strictly separated from protocol revenues in our ledger.
* **Tamper Protection:** Database rules prevent past financial entries from being modified or deleted. Any accounting corrections must be recorded as a new reversing transaction.
* **Error Handling:** If a mobile money or card network fails or returns an unexpected error, the transaction is automatically flagged and saved for manual review rather than failing silently.

---

### 5. Expected Launch Volume (Beta Pilot)

* **Target Launch Cohort:** 25 to 50 chamas (approx. 2,500 to 5,000 members).
* **Average Payment Size:** KES 1,000 to KES 2,500 ($8 to $20 USD) per member contribution.
* **Projected Monthly Volume (Months 1–3):** KES 5,000,000 to KES 10,000,000 (~$40,000 to $80,000 USD).
* **Growth Target (Months 6–12):** KES 30,000,000 to KES 50,000,000/month as additional groups onboard.

---

### 6. What We Need from Leadership & Board

1. **Paystack Follow-up:** Help follow up with Paystack compliance to approve our live account so we can take live debit/credit cards.
2. **Pilot Group Confirmation:** Finalize the roster of the first 10–25 chamas that will participate in the closed beta rollout once live payment keys are issued.

---
*Simon Wandera*  
*Systems Architect & Backend Lead, Baraza Protocol*
