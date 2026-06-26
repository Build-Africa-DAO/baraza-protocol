# Counsel Review Checklist — Whitepaper Distribution

Pre-distribution gate for any document in `docs/whitepaper/`. Every item below must be either **cleared** by counsel or **deliberately deferred** with a written reason on file before any external send.

Founder owner: Aziz Mohammed · Draft: 2026-06-19 · Status: not yet sent to counsel.

---

## 1. Securities classification (per jurisdiction)

| Jurisdiction | Question | Status |
|---|---|---|
| Kenya | Is BRZA a "security" under the Capital Markets Act? Does the IDO require CMA registration or exemption? **Also: VASP Act, 2025 — passed 7 Oct 2025, assented 15 Oct 2025; draft Regulations 2026 published under joint CMA + CBK oversight.** | Open |
| Nigeria | SEC Rules on Digital Assets (2022, as amended) — does BRZA fall under "Utility Token" exemption or require full ISA registration? | Open |
| South Africa | FSCA position on crypto assets as financial products (Oct 2022 declaration) — implications for any ZAR-priced participation? | Open |
| Uganda | Capital Markets Authority — current posture on token offerings? | Open |
| Ghana, Tanzania, Ethiopia | Same question, lighter-touch markets | Open |
| US persons | Are we explicitly excluding US persons from Phase 0 / IDO? Reg S / Reg D posture? | Open |
| EU / UK | MiCA classification (utility vs e-money vs asset-referenced); FCA approach if any UK marketing | Open |

**Outcome required:** A per-jurisdiction matrix that tells operations: open / restricted / closed for Phase 0 and for IDO.

---

## 2. Mobile-money and VASP licensing

| Item | Counsel deliverable |
|---|---|
| **Kenya VASP Act, 2025 — primary path** | Stand up a Kenya-domiciled operating entity with a physical office; brief CMA + CBK; complete director KYC and competence assessments. Confirm licensing class (exchange / wallet / custodian / "other intermediary") that Baraza falls into. 8–12-week lead. |
| **Kenya VASP — foreign company posture** | If any group entity is foreign-domiciled, obtain a compliance certificate before applying for licensing. Confirm pathway in writing. |
| Kotani Pay license coverage | Does Kotani Pay's existing licensing cover Baraza's flow, or do we need direct registration as a payment-services provider? |
| M-Pesa Daraja approval | Confirm KYC posture (member phone hashes vs raw PII) is compatible with Safaricom requirements **and** sequenced behind VASP entity registration |
| Multi-MNO expansion | Same question for MTN MoMo, Airtel Money, Telebirr |
| VASP registration (other jurisdictions) | Per-jurisdiction list of where Baraza itself must register as a VASP vs operating through licensed integrators (Nigeria, South Africa, Uganda, Tanzania, Ethiopia) |
| Cooperative-law standing | In Kenya, can a Cap. 490 registered cooperative use Baraza as its ledger without losing its legal standing? Same for Uganda Cooperatives Act. Confirm the "digital cooperative" framing in marketing does not unintentionally pull Baraza itself under cooperative supervision. |

---

## 3. Tokenomics representation review

Counsel must scrub the whitepapers for any phrasing that could be read as a price prediction, return promise, or investment-contract solicitation.

- [ ] "BRZA is presented as a utility and participation token pending counsel review" — accept, reframe, or replace.
- [ ] Vesting schedules described as committed — confirm they are enforceable in the entity that signs the sale agreements.
- [ ] Use-of-funds bucket "Treasury reserve" — disclose multisig structure or remove if not finalised.
- [ ] Roadmap phasing — confirm forward-looking statements are guarded with "subject to change."
- [ ] Referral mechanic description — confirm 500/250 BRZA payouts, time-limited at Phase 0, do not constitute a regulated promotion under per-jurisdiction marketing law.
- [ ] Baraza TV revenue-share language — confirm 70/20/10 split is not characterised as a passive income product.
- [ ] Loan terms (50% LTV, 5% APR) — confirm cooperative-finance carve-out applies; otherwise reframe as a lending product subject to licensing.

---

## 4. Disclaimers and risk disclosure

- [ ] Investor whitepaper §11 (Risks) — counsel signs off as adequate disclosure for the targeted investor cohort.
- [ ] Public whitepaper §17 (Disclaimers) — counsel signs off as adequate retail-facing disclaimer.
- [ ] One-pager footer — counsel signs off as adequate for a single-page warm-intro context.
- [ ] Per-jurisdiction selling restrictions appendix — drafted before any sale opens.
- [ ] No-redistribution language on investor whitepaper — counsel confirms enforceability and updates wording if needed.
- [ ] Forward-looking statements disclaimer — added or expanded as needed.

---

## 5. Cap table and entity

- [ ] Sale entity identified (BVI / Cayman / Mauritius / domestic — counsel recommendation).
- [ ] Founder allocations (Founder A + Founder B, 7.5% each) reflected in entity equity / token-side documents — no discrepancy.
- [ ] Founder B identity confirmed before any strategic-round close, or allocation routed to Reserve via documented council vote.
- [ ] Multisig signer set named (Kofi council cond 4(d), `multiSigSignersWallets`) — counsel reviews KYC posture for signers.
- [ ] Vesting administered by a counterparty (token admin tool, multisig, escrow) — counsel confirms enforceability against `vestedAmount()` math.

---

## 6. Data protection and member privacy

- [ ] GDPR / Kenya Data Protection Act (2019) / Nigeria NDPR posture on phone-number hashing and pepper rotation.
- [ ] Confirm member PII (phone, email, M-Pesa receipts, KYC) never written to a public chain — code path audited.
- [ ] Privacy split table in `PUBLIC_WHITEPAPER.md` §9 reviewed and accurate.
- [ ] Counsel approves the language "Phone numbers are stored as salted hashes; the salt is a server-side secret that is never logged or exposed."

---

## 7. AI claims

Akili (Claude relay + 5-agent council) is described in both whitepapers. Counsel should confirm:

- [ ] The statement "Akili is never a signer" is accurate in code (`/api/agent/chat.ts`, `app/src/lib/akili/`).
- [ ] No representation that Akili replaces human judgement, fiduciary duty, or signer responsibility.
- [ ] AI provider (Anthropic) named — confirm marketing terms allow this disclosure.
- [ ] No promise of AI-driven returns or investment advice.

---

## 8. Cross-document consistency

Before send, run the tokenomics audit (`docs/TOKENOMICS_AUDIT_REPORT.md` methodology) over:

- `docs/whitepaper/README.md`
- `docs/whitepaper/PUBLIC_WHITEPAPER.md`
- `docs/whitepaper/INVESTOR_WHITEPAPER.md`
- `docs/whitepaper/TEAM.md`
- `docs/whitepaper/ONE_PAGER.md`

Confirm every numeric and every claim is consistent with `app/src/lib/brza/constants.ts`. The Notion allocation variant (110% sum) is **not** authoritative and must not leak into any external doc.

---

## 9. Items deliberately NOT included (per `CLAUDE.md`)

Confirm none of these have crept into a draft:

- [ ] No reference to Builder Protocol, Nouns DAO, or noun.wtf.
- [ ] No wallet support beyond Phantom, Solflare, Coinbase Wallet.
- [ ] No `withdrawals_enabled = true` claim.
- [ ] No raw secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_INTENT_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `KOTANI_PAY_API_KEY`, any private key).
- [ ] No treasury, issuer, or distributor wallet addresses.
- [ ] No price predictions beyond the published phase prices.

---

## 10. Sign-off

| Reviewer | Role | Date | Notes |
|---|---|---|---|
| _________ | Lead counsel (Africa) | | |
| _________ | Securities counsel | | |
| _________ | Data-protection counsel | | |
| _________ | Founder | Aziz Mohammed | Final author sign-off |

Once all sign-offs are recorded, attach this checklist (or a redacted version) to the distribution pack.
