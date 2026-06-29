# Baraza Protocol — Public Whitepaper

**For communities, members, contributors, and anyone deciding whether to join.**

Version 0.1 · Working draft · 2026-06-19

---

## 1. What Baraza is, in one paragraph

Baraza is a shared treasury and governance system for African communities — chamas, stokvels, SACCOs, cooperatives, alumni groups, burial societies, DAOs, and twenty other community types. It lets any group collect dues by M-Pesa, record every shilling on a public ledger, vote together on how money is spent, and never let one person move funds alone. You join with a phone number. You do not need a bank account, a seed phrase, or a crypto wallet.

Another way to say the same thing: Baraza is a **digital cooperative.** A chama on Baraza is a co-op with an honest ledger. A SACCO on Baraza is a co-op whose members can vote from a feature phone. Kenya's Cooperative Societies Act (Cap. 490) already recognises this form for chamas and SACCOs; what Baraza adds is the ledger and the voting rail. The protocol does not replace the cooperative — it gives it the infrastructure it has been missing.

---

## 2. The problem we are solving

Millions of African communities already pool money every week. They use WhatsApp groups, paper ledgers, and a treasurer's personal bank account. This works until it doesn't:

- **No audit trail.** When records live in a notebook or one person's phone, members cannot verify the books.
- **Funds go missing.** Treasurer attrition, family emergencies, and quiet diversions are common — and rarely recovered.
- **No real say.** Decisions are made in person, by the loudest voice or the oldest member. Quieter members and absent members are written out.
- **No portability.** When a chairperson leaves, the records often leave with them. The community starts over.
- **No outside support.** Communities with a real track record have no way to prove it to lenders, grant-makers, or partners.

Crypto, in its current form, doesn't help. It asks people who already trust each other to learn seed phrases, gas fees, and English-only wallets. That isn't a community tool — it's a hobby.

Baraza is built for the **opposite** path: communities that already exist, already trust each other, and want a better ledger, vote, and treasury — not a new culture.

---

## 3. What a Baraza community can do

A community on Baraza can:

1. **Form** — pick a community type (one of 23: chama, stokvel, SACCO, DAO, cooperative, ROSCA, ASCA/VSLA, alumni, religious, sports, burial, PTA, …). Type sets sensible defaults at creation; it never changes runtime behaviour later.
2. **Admit members** — by phone number, by wallet, or by both. Membership is represented by an on-chain attestation after dues are paid.
3. **Collect dues** — members pay via M-Pesa (Kenya first), with USSD and SMS confirmation on a feature phone.
4. **Hold a treasury** — every community has a Stellar account. Balances are public. Movements require a vote.
5. **Vote on proposals** — anyone can propose. Quorum, approval threshold, and voting window are set per community.
6. **Pay contributors** — the treasury can pay contributors after a vote, with the payout recorded on-chain.
7. **Earn BRZA** — members earn BRZA tokens for staying current on dues, voting, proposing, and completing bounties.
8. **Show their track record** — a community's activity becomes a public reputation: dues collected, proposals passed, votes cast, contributors paid.

---

## 4. How a member joins (the phone-first path)

The point of Baraza is that a member who only has M-Pesa and a Nokia phone can still join, vote, and earn.

1. The community admin shares a join link or USSD code.
2. The new member dials the USSD short code on any phone — no app, no internet.
3. They confirm their phone number, name, and the community they are joining.
4. They pay dues by M-Pesa. The amount, currency, and recipient are shown before they confirm.
5. The protocol verifies the payment, allocates BRZA according to the community's rules, and mints a membership attestation.
6. The new member receives an SMS confirming they are in.
7. From that moment on, they can vote by USSD or by web — same vote, same weight.

A member who already has a wallet (Phantom, Solflare, or Coinbase Wallet) can link it during onboarding and skip the M-Pesa rail for any future dues.

---

## 5. How decisions are made

Every community runs the same primitives, regardless of type:

- **Proposals.** Any member can write a proposal: spend money, change a rule, admit a member, fire a contributor, anything.
- **Voting weight.** Default is one-member-one-vote. Communities can choose dues-weighted, tenure-weighted, or hybrid weighting at creation.
- **Quorum.** A proposal needs a minimum share of eligible voters to participate before it can pass. The default depends on community type (a burial society uses a higher quorum than an investment club).
- **Approval threshold.** A proposal needs a minimum share of *cast* votes to pass. Default is 50%+1, but treasury moves usually need a supermajority.
- **Voting window.** Open for a fixed period — often 72 hours — after which the result is final.
- **Execution.** Treasury moves do not auto-execute. They require a final signer step from the multisig holders the community elected.

The point: the community sets its own rules at creation and the protocol enforces them. Nobody at Baraza can move a community's money.

---

## 6. Akili — the AI helper, with limits

Akili is the protocol's AI helper. It runs in two surfaces:

- **Akili relay** — a chat surface inside the app. Akili helps members draft proposals, summarise long ones, translate between English and Swahili, and explain a community's books.
- **Akili Council** — five specialists (Amara, Kofi, Zara, Nia, Seku) that the protocol calls when a decision affects more than one community — for example, when changing referral rules or token emission.

Akili is never a signer. It does not move money. It does not approve proposals. A member can ignore everything Akili says and the community still works. Akili is a translator and a second pair of eyes, not an authority.

---

## 7. BRZA — the community token, in plain language

BRZA is the Baraza token. It does several jobs:

- **It rewards participation.** Pay dues on time, vote, propose, win a bounty — earn BRZA.
- **It funds builders.** Contributors who improve the protocol or a community get paid in BRZA.
- **It signals reputation.** A community's BRZA flow is a public signal of how active and how trusted it is.
- **It powers Baraza TV.** Creators on Baraza TV earn BRZA per content milestone, and viewers earn BRZA for engagement.

**BRZA is not M-Pesa.** Members pay dues in shillings; the protocol records and mints in BRZA. The two are not the same. A community can hold a balance of both. Dues collected in M-Pesa stay denominated in the local fiat value at the time of payment.

**BRZA is not a get-rich token.** It is a participation and reputation token first. The protocol explicitly does **not** make price predictions and does **not** promise returns. Anyone telling you otherwise is not speaking for Baraza.

**Supply and price** (full table in the investor whitepaper):

- Total supply: 1,000,000,000 BRZA, capped.
- Phase 0 (current): $0.02 per BRZA — community pre-sale.
- IDO: $0.10 per BRZA — public launch.
- 20% of supply is set aside for community rewards, with a hard ceiling of 2,000,000 BRZA emitted per month.

---

## 8. Earning BRZA as a member

Members can earn BRZA in four ways:

| Activity | What it does |
|---|---|
| **Stay current on dues** | Each on-time dues payment earns a membership reward, scaled by the community's emission rules |
| **Vote** | Casting a vote on an open proposal earns a small, fixed governance reward |
| **Propose** | Writing a proposal that *passes* earns a larger one-off governance reward |
| **Complete a bounty** | Bounties posted by communities pay BRZA on completion, after a member-led review |

The total monthly emission across the whole protocol is capped at 2,000,000 BRZA to prevent inflation.

**Referrals** are a separate, time-limited mechanic. A member who brings in a new member who pays dues for 90 days *and* makes 3 payments earns a small one-off referral reward. The referee also earns a small one. This is governed by separate council conditions and is **disabled** above the Phase 0 price until identity-verification rails (Celo G$ or Soroban credentials) are live.

---

## 9. Privacy — what is on-chain and what is not

Baraza is deliberately split between **public** and **private** data:

| On-chain (public) | Off-chain (private, never leaves Supabase) |
|---|---|
| Treasury balance | Member phone numbers |
| Vote counts and outcomes | Member emails |
| Membership attestations | M-Pesa receipts |
| Proposal text and metadata | KYC documents |
| Bounty completion records | Admin notes |
| BRZA transfers | Support tickets |

The protocol never puts a phone number, an email, an M-Pesa receipt, or a KYC document on a public chain. Phone numbers are stored as salted hashes; the salt is a server-side secret that is never logged or exposed.

---

## 10. Communities Baraza is built for

The protocol supports 23 community types. **Type is a label and a defaults preset, not a separate product.** A burial society and an investment club run the same primitives — the difference is in the defaults the community chose at creation.

- Savings group (chama)
- Stokvel
- SACCO
- DAO
- Cooperative
- Professional network
- Investment club
- ROSCA (rotating savings)
- ASCA / VSLA
- Union
- NGO
- Alumni group
- Religious community
- Sports club
- Homeowners association
- Burial society
- Tribe / clan group
- Welfare group
- Parent-teacher association
- Youth group
- Political caucus
- Supply chain cooperative
- Study circle

---

## 11. Where Baraza runs

Baraza is multi-chain by design but **Stellar-first** by priority. The order below never changes:

1. **Stellar** — primary. Every treasury is a Stellar G-account. BRZA is a Stellar custom asset. M-Pesa flows in via Kotani Pay → XLM → community treasury.
2. **Solana** — governance. Five Anchor programs handle treasury logic, governance, membership, community registry, and payment attestation. Written; not yet on devnet at the time of this draft.
3. **Base (EVM)** — secondary. Aragon OSx is the underlying governance OS for EVM communities.
4. **Celo** — mobile identity. GoodDollar G$ scaffold for low-friction proof-of-personhood.

A community does not need to think about chains. The protocol routes dues, mints, and votes to the right chain in the background.

---

## 12. Baraza TV

Baraza TV is community-led video built into the protocol. Creators run editorial — the show runner, the head writer, the director, the editor — and creators are paid in BRZA per content milestone. Episodes about a community's vote or dues drive are sourced from on-chain activity, never invented. The full creator share is 70% of subscription and tip revenue, with 20% to the community DAO treasury and 10% to the protocol reserve. Creators must hold an active community membership.

---

## 13. What Baraza is **not**

- Not a bank. Baraza does not lend you money or hold your savings.
- Not a wallet. Your existing wallet (Phantom, Solflare, Coinbase) plugs in. Baraza does not replace it.
- Not custodian. The community's multisig moves funds, not Baraza.
- Not the Builder Protocol, not Nouns DAO. Baraza uses Aragon OSx on EVM and its own primitives on Stellar and Solana.
- Not an investment scheme. BRZA is a participation and reputation token. The protocol does not promise returns.

---

## 14. Roadmap

| Phase | What ships | Status |
|---|---|---|
| **Phase 0** | Phone-first onboarding, M-Pesa dues, Stellar treasury, membership minting, proposals, voting, activity feed, admin order review | In active build |
| **Phase 1** | Stellar payment verification at mainnet, BRZA mint on confirmed dues, council referral gate live at Phase 0 prices only | Cleared, conditional |
| **Phase 2** | Bounty market — communities post work, contributors complete it, members rate it, BRZA pays out after a vote | Planned |
| **Phase 3** | Baraza TV creator economics live, weekly episodes, vote-to-watch correlation tracking | Planned |
| **Phase 4** | Solana governance programs deployed; cross-chain BRZA bridging | Planned |
| **Phase 5** | Public DEX for community tokens; liquidity pool unlock | Planned |
| **IDO** | Public sale at $0.10, liquidity unlock, Reserve cliff continues | Planned |

This roadmap is sequenced, not promised. Each phase depends on the previous one shipping and being audited.

---

## 15. How to join

If you run a community today and want to try Baraza:

- Visit **baraza-protocol.vercel.app** and create a community in under 10 minutes.
- Or, if your members only have feature phones, contact us to enable USSD onboarding in your country.

If you build, write, design, or research — Baraza pays in BRZA. Bounties are posted on the protocol once Phase 2 ships.

---

## 16. Contact

- Founder: Aziz Mohammed — `wethem2022@gmail.com`
- GitHub: `github.com/Azizudinly/baraza-protocol`
- Live: `baraza-protocol.vercel.app`

---

## 17. Disclaimers

Nothing in this document is investment advice, an offer of securities, or a promise of future returns. BRZA is a utility and participation token, not equity. Token values can go down. The protocol is in active development; features described here may change. Read the investor whitepaper for the full risk section before participating in any sale.
