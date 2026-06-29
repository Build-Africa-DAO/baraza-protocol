# Investor FAQ

Answers to the questions every diligence pass asks. Companion to the [investor whitepaper](./INVESTOR_WHITEPAPER.md) and the [research brief](./RESEARCH_RWA_DAO.md). Working draft, 2026-06-19.

---

## Market

**Q. How is this a real market, not crypto-flavoured vapour?**
The Kenyan regulated SACCO sector alone has KSh 1.21T in assets (~$9.3B). ~300,000 Kenyan chamas hold an additional ~KSh 300B (~$3.4B) entirely outside regulated statistics. South Africa has ~800K stokvels with ~11M members and ~R50B (~$2.7B) annual turnover. Conservatively $15B+ across just three rails before adding Tanzania, Uganda, Ethiopia, Nigeria, or diaspora. The market exists; it currently uses WhatsApp + paper + a treasurer's bank account. See [`RESEARCH_RWA_DAO.md`](./RESEARCH_RWA_DAO.md) §4 for sourcing.

**Q. Why hasn't a bank or a fintech eaten this already?**
Banks have chama accounts (Equity, KCB, Standard) but no governance primitives — they're a closed ledger with one signer. Fintechs (ChamaSoft, M-Chama) have local presence and language fluency but no on-chain audit trail and no portable reputation. The gap that Baraza fills is **mobile-money-native onboarding × on-chain governance × member-level reputation × RWA-compatible treasury.** Each existing player covers one or two; none covers all four.

**Q. Why now?**
Four things converged. Mobile money is mature (M-Pesa for ~20 years). Stellar settlement is cheap and verifiable for high-volume small-value flows. Claude-class AI lifts the literacy / English barrier on governance (proposal drafting, Swahili-English translation). And the chama / SACCO / stokvel sectors have all hit a regulator-noticed scale where the next move is digitisation — South Africa Treasury and Kenya SASRA are both pushing in that direction.

---

## Product

**Q. What's actually built versus on a roadmap?**
Phase 0 (in active build): community creation with 23 type presets, phone-first onboarding via USSD + SMS, M-Pesa dues via Kotani Pay sandbox, Stellar treasury G-accounts, BRZA mint on confirmed dues, membership attestation gated by activation secret, proposal + voting (web and USSD), Akili relay (Claude streaming) and council, USSD session monitoring. Phase 1 (cleared, in build): Stellar mainnet verification. Withdrawal multisig handoff is explicitly disabled until devnet-tested. Bounty market (Phase 2), Baraza TV (Phase 3), Solana programs (Phase 4), DEX (Phase 5), IDO — all planned, in that order.

**Q. Why Stellar before Solana before EVM?**
Stellar's payment-first design and Soroban smart contracts fit the M-Pesa → XLM → treasury path natively, with sub-cent transaction costs at the volumes a chama actually moves. Solana hosts the heavier governance programs (five Anchor programs written, not yet on devnet). EVM via Aragon OSx is for communities that already touch Base or want EVM-native treasury tooling. The chain priority order is locked in `CLAUDE.md`: Stellar first, never re-ordered.

**Q. Is Baraza a DAO platform or a chama platform?**
Both, deliberately. Externally we use "digital cooperative" because Wyoming's 2025 amendment now treats a DAO LLC as a *limited liability cooperative*, and Kenya's Cap. 490 already recognises chamas and SACCOs as cooperatives. The framing collapses the binary. In code, there's one set of primitives — a chama, a SACCO, a DAO, and a burial society all run identical proposals, votes, treasuries, and emission.

**Q. What about USSD on a feature phone — does that actually work?**
Yes. Africa's Talking sandbox is integrated; USSD session monitoring and SMS welcome fallback ship in `app/api/ussd/index.ts`. A member dials a short code, confirms a few prompts, pays via M-Pesa, and is in. Production volume approval is pending — that's an Africa's Talking process, not an engineering one.

**Q. What's the AI doing, and what is it not doing?**
Akili is a Claude-streaming chat surface inside the app (drafts proposals, translates between English and Swahili, summarises). The Akili Council is five specialists (Amara/Kofi/Zara/Nia/Seku) that run protocol-level analysis. Both produce recommendations; neither signs. A member can ignore everything Akili says and the community still works. `withdrawals_enabled = false` until a *human* multisig is named and devnet-tested.

---

## Tokenomics

**Q. Is BRZA a security?**
Pending counsel review per jurisdiction. The whitepaper positions BRZA as a utility and participation token; final classification will be appended before any sale opens. See [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md) §1 for the per-jurisdiction matrix that gates the IDO.

**Q. Why are there two founder buckets when only one founder is named?**
Founder B is reserved (75M, 7.5%, same 1-year cliff + 3-year vest as Founder A). The slot is held; identity will be confirmed before any strategic round close. If unfilled at IDO, the slot is redirected to the Reserve bucket via a council vote — the protocol does not auto-mint to an unnamed wallet. See [`TEAM.md`](./TEAM.md).

**Q. The Notion spec sums to 110%. Which numbers are real?**
The on-chain constants in `app/src/lib/brza/constants.ts` are authoritative. The whitepapers follow that file. The Notion variant is a known stale draft (5 buckets are overstated) and is **not** authoritative. See [`docs/TOKENOMICS_AUDIT_REPORT.md`](../TOKENOMICS_AUDIT_REPORT.md).

**Q. What's the emission math?**
Community Rewards bucket is 200M (20%) emitted over 5 years with a hard ceiling of 2M BRZA/month protocol-wide. Internal split: 40% bounty pool / 30% membership reward (on-time dues) / 20% governance reward (vote, propose) / 10% reserved. Referrals do **not** draw from this bucket — they draw from the separate 50M Referral bucket.

**Q. Referral mechanic — explain the council conditions.**
Phase 6 referral payouts shipped 2026-06-19 under four conditions enforced at runtime by `referralPayoutBlockedReason()`: (1) 90-day + 3-payment eligibility gate before any payout; (2) 500 BRZA referrer / 250 BRZA referee, capped 5 paid pairs per referrer per rolling 12 months and 50,000 BRZA/month protocol-wide; (3) disabled above Phase 0 ($0.02) until identity continuity (Celo G$ or Soroban credential) is live; (4) disabled at runtime unless `PAYMENT_PHONE_HASH_PEPPER` is configured and multisig signers are named. The referral mechanic auto-disables at IDO until identity rails ship.

**Q. What's the LP unlock at IDO and how does it lock?**
80M BRZA (8% of supply) unlocks at IDO and is locked into the public LP for 12 months. Public-sale buyers vest on a 180-day cliff + 365-day linear schedule. Reserve (10%, 100M) has a 730-day cliff *and* additionally requires a governance vote to release — it does not unlock on time alone.

---

## Revenue & business model

**Q. How does Baraza make money?**
Four surfaces, sequenced: (1) 2% protocol fee on outbound treasury transactions — the primary surface; (2) 10% protocol share of Baraza TV creator subscription + tip revenue (70/20/10 with creator and community DAO); (3) 0.5% swap fee on the community-token DEX (Phase 5); (4) RWA credit bridge — Baraza's on-chain community history becomes the underwriting input for Goldfinch / Centrifuge / Huma. The bridge is the long-tail value driver; the others fund the bridge.

**Q. Why no discretionary marketing spend?**
The growth budget is Community Rewards emission (capped 2M/month) and the Grants bucket (8%, 6-month cliff + 2-year vest). A protocol whose audience is community treasurers does not buy distribution — it earns it through referrals, Baraza TV editorial pull, and direct co-op-sector outreach. Marketing-as-a-line-item creates pressure that distorts editorial independence (the Baraza TV crew protects against this) and pulls the protocol toward yield-token framing (which we avoid for regulatory reasons).

---

## Legal & regulatory

**Q. What is the #1 pre-IDO blocker?**
Kenya VASP Act, 2025 compliance. Act passed 7 Oct 2025, presidential assent 15 Oct 2025, draft Regulations 2026 under joint CMA + CBK oversight. Requires Kenya-domiciled entity, physical office, director KYC/competence — 8-to-12-week process. This is above Daraja approval in the dependency order because Daraja depends on the operating entity. See [`INVESTOR_WHITEPAPER.md`](./INVESTOR_WHITEPAPER.md) §10.1.

**Q. What entity will issue tokens at IDO?**
TBD per counsel. Likely Marshall Islands MIDAO LLC or Cayman Foundation for the issuer, with a Kenya operating subsidiary for the Kenyan market. Marshall Islands DAO LLC is the dominant structure in 2026 (80+ DAOs adopted). See [`RESEARCH_RWA_DAO.md`](./RESEARCH_RWA_DAO.md) §3.3.

**Q. What's the regulatory posture toward chamas / SACCOs that use Baraza?**
Chamas and SACCOs continue to operate under Kenya's Cooperative Societies Act (Cap. 490) and SASRA's regulated SACCO framework. Baraza is the ledger and rail, not a substitute for the cooperative's legal form. A Cap. 490 registered cooperative can use Baraza as its ledger without losing legal standing — that mapping is being confirmed by counsel as part of the cooperative-law standing item in [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md) §2.

**Q. Will the IDO open to US persons?**
Excluded by default unless Reg S / Reg D structure is in place. Confirmed in [`products/03_IDO.md`](./products/03_IDO.md) jurisdictional gates.

**Q. What's the privacy posture on member PII?**
On-chain: treasury balance, vote counts, membership attestations, proposal text, bounty completion, BRZA transfers. Off-chain (Supabase, RLS-gated): phone numbers, emails, M-Pesa receipts, KYC documents, admin notes, support tickets. Phone numbers are stored as salted hashes; the salt (`PAYMENT_ADAPTER_PROXY_SECRET` / `PAYMENT_PHONE_HASH_PEPPER`) is a server-side secret never logged or exposed. See [`PUBLIC_WHITEPAPER.md`](./PUBLIC_WHITEPAPER.md) §9.

---

## Competition

**Q. Why doesn't Aragon eat this?**
Aragon OSx is the EVM governance OS that Baraza uses for its EVM deployments — they are infrastructure, not a competitor. Aragon has no mobile-money rail, no USSD surface, no Swahili-first onboarding, and no chama / SACCO product. The Aragon team is not addressing this cohort.

**Q. Why doesn't Goldfinch / Centrifuge / Huma eat this?**
They lend to fintechs and MFIs, not to communities. None has a member-level ledger or a governance surface. Goldfinch's 10–17% APY headlines are at the lender layer, not at the community layer. Baraza generates the on-chain community history that *makes a community a legible borrower* — once that's live, Goldfinch / Centrifuge / Huma are downstream credit suppliers, not competitors. Centrifuge already shipping deRWA on Stellar (deJTRSY, deJAAA) validates the chain choice.

**Q. Why doesn't a bank-managed chama account win?**
Closed ledger, no governance primitives, no portable reputation, no member-level vote weight, no token rewards. The bank model is "we hold the money, the chair signs." The Baraza model is "the community holds the money, the members vote." Banks cannot ship the second one without dissolving their own product.

**Q. What if a competitor copies the mobile-money + on-chain stack?**
The infrastructure stack is replicable; the council, the editorial discipline on Baraza TV, the Kenya VASP entity, the council-rulings record, and the multi-jurisdiction legal posture take 18+ months to build. The defensible moat is the community track record that accumulates on-chain over time — a competitor starts from zero on that even if they ship the same primitives tomorrow.

---

## Risk

**Q. What kills this product?**
A change to M-Pesa Daraja pricing or terms that we can't pass through. A Kenya VASP Act ruling that classifies BRZA as a regulated security and prices us out of the IDO. A high-trust mass-Sybil incident on the referral mechanic that consumes the 50M bucket before the gate hardens (council's referral conditions mitigate this — but the residual risk is real). An unrecoverable bug in the Stellar payment-verification path that loses member dues. Each is listed and mitigated in [`INVESTOR_WHITEPAPER.md`](./INVESTOR_WHITEPAPER.md) §11.

**Q. What if Anthropic deprecates Claude or the API goes down?**
Akili degrades to a classified `auth_failed` event and the protocol continues. AI is never on the critical path. The chat surface goes static; everything else (dues, votes, mints, treasury) keeps running.

**Q. What's the disaster recovery story for member funds?**
Each community treasury is a Stellar G-account controlled by the community's elected multisig. Baraza does not custody. If the protocol's web frontend goes down, members can transact directly against their Stellar G-account using a wallet (Phantom / Solflare / Coinbase Wallet). Supabase is RLS-gated and degraded-mode safe; if Supabase is down, the protocol read-only-degrades but does not lose data. `withdrawals_enabled = false` until the multisig handoff is devnet-tested as the load-bearing safeguard.

---

## Ask

**Q. What are you raising?**
Pre-seed / seed with patience for an 18-to-24-month Phase 0 → IDO ramp, plus strategic capital that brings African mobile-money or cooperative-finance distribution. Specific terms are out-of-band, not in the whitepaper pack.

**Q. What do you want besides money?**
Operational partners for VASP licensing, Daraja / MNO approvals, and SACCO-sector outreach (Kenya / Uganda priority). Audit partners for the Stellar payment-verification path, the Solana Anchor programs, and the EVM Aragon OSx integration. A general counsel with Africa cross-jurisdiction practice. A CFO / treasury lead. See [`TEAM.md`](./TEAM.md) for the full TBA list.

**Q. Where do I go next?**
- One-pager for warm intros: [`ONE_PAGER.md`](./ONE_PAGER.md)
- Full diligence read: [`INVESTOR_WHITEPAPER.md`](./INVESTOR_WHITEPAPER.md)
- Per-product detail: [`products/`](./products/)
- Market thesis with sources: [`RESEARCH_RWA_DAO.md`](./RESEARCH_RWA_DAO.md)
- Team: [`TEAM.md`](./TEAM.md)
- Counsel posture: [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md)
- Founder: Aziz Mohammed — `wethem2022@gmail.com`
