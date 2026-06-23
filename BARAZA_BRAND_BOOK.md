# Baraza Protocol — Brand Book

**Status: v1.0 LOCKED · June 2026 · BuildAfrica DAO**

This is the single source of truth for Baraza's identity, voice, color, and
type. Tokens here are implemented in `app/globals.css` (`@theme inline`) and
loaded in `app/layout.tsx`. Do not introduce colors, fonts, or voice outside
this system without updating this file first.

---

## 1. Identity

- **Name:** Baraza Protocol
- **Parent:** BuildAfrica DAO
- **Tagline:** "Your community. Your decisions."
- **Brand promise:** Any African community can vote, decide, and act together — simply.

**Mission**
> Baraza exists to give every African community — chama, cooperative, council,
> or crew — the tools to make decisions that stick, build trust, and move
> forward together.

**Personality (the four, held consistently)**
- **Direct** — says what it means.
- **Warm** — community-first, people-first.
- **Confident** — built for Africa, not adapted for it.
- **Grounded** — real communities, real decisions.

---

## 2. Voice

- Active voice, always.
- Sentence case, always.
- Plain words over smart words.
- Specific over vague.
- Short sentences. One idea each.

**Never use (user-facing):** leverage · ecosystem · synergy · innovative ·
blockchain · crypto · decentralized · web3 · treasury · governance · DAO ·
on-chain · proposal · wallet (at entry).

**Examples**
- Button: "Send code →" not "Submit"
- Error: "That code didn't work. Try again or request a new one." not "OTP validation failed"
- Empty state: "No votes yet — start one →" not "No data found"

---

## 3. Color system (LOCKED)

### Primary
| Token | Hex | Role |
|---|---|---|
| `--baraza-black` | `#0D0F0E` | Near-black, warm undertone — primary background |
| `--baraza-lime` | `#C8F060` | Electric lime — primary action / CTA |
| `--baraza-ember` | `#E8784A` | Terracotta ember — warmth, secondary |
| `--baraza-teal` | `#4ABFB0` | Community teal — connection, trust |
| `--baraza-white` | `#F2F4F0` | Warm white — primary text on dark |

### Surface
| Token | Hex | Role |
|---|---|---|
| `--baraza-surface` | `#161918` | Card / panel background |
| `--baraza-border` | `#2A2E2C` | Subtle dividers |
| `--baraza-muted` | `#7A8480` | Secondary / meta text |

### Light mode (future)
| Token | Hex |
|---|---|
| `--baraza-bg-light` | `#F5F3EF` |
| `--baraza-text-light` | `#1A1A1A` |

### Status
| Token | Hex |
|---|---|
| `--baraza-success` | `#4ADE80` |
| `--baraza-warning` | `#FBBF24` |
| `--baraza-error` | `#F87171` |

### Usage rules
- **Lime = ONE primary CTA per page only.** (On login: "Send code →" / "Verify".
  Google keeps its own surface style so lime stays singular.)
- Ember = secondary actions, highlights.
- Teal = community features, connection.
- Never use lime as a background for large areas.
- Minimum text contrast **4.5:1**. Lime backgrounds carry near-black text
  (`--baraza-black`) for contrast; white text only on dark surfaces.

---

## 4. Typography (LOCKED)

| Role | Family | Weights | Notes |
|---|---|---|---|
| **Display** | **Syne** | 700 | Headlines, hero, section titles. Never below 24px. Tracking −0.02em on large headlines. |
| **Body** | **DM Sans** | 400 / 500 / 600 | Body, labels, buttons, nav. Line height 1.5 body, 1.2 headings. |
| **Mono** | **JetBrains Mono** | 400 / 500 | Numbers, codes, OTP, data only. Never body copy. |

All three are free Google Fonts, loaded via `next/font` with `display: swap`.
CSS vars: `--font-display` (Syne), `--font-sans` (DM Sans), `--font-mono`
(JetBrains Mono).

### Type scale
| Token | Size / line-height |
|---|---|
| `--text-xs` | 12px / 1.4 |
| `--text-sm` | 14px / 1.5 |
| `--text-base` | 16px / 1.5 |
| `--text-lg` | 18px / 1.4 |
| `--text-xl` | 24px / 1.3 *(Syne starts here)* |
| `--text-2xl` | 32px / 1.2 |
| `--text-3xl` | 40px / 1.1 |
| `--text-4xl` | 56px / 1.0 |
| `--text-5xl` | 72px / 0.95 |

---

## 5. Logo system

**Mark:** concentric rings — the community assembly motif (people gathering,
the baraza circle, collective decision-making).

- **Minimum size:** 32 × 32px.
- **Clear space:** equal to the height of the mark on all sides.
- **In-product implementation (current):** a CSS concentric-ring mark
  (lime + teal rings) used in the auth shell and dashboard until exported
  assets exist.

**Logo variants — PENDING.** The brand-book brief was truncated before the
variant list, and exported assets are a Canva MCP step to be confirmed with
Aziz. Expected set (to confirm): full lockup (mark + wordmark), mark-only,
mono/reversed (white-on-dark, black-on-light), favicon/app icon, social avatar.
Once the list and Canva run are approved, export and link them here.

---

## 6. Motion

- GSAP for entrance staggers, step transitions, focus pulses, success/error.
- Durations 0.25–0.4s, eases `power2.in/out`.
- **All motion wrapped in `prefers-reduced-motion`** — animations are skipped,
  never required to reveal content.

---

## 7. Accessibility & mobile (non-negotiable)

- Touch targets ≥ 48 × 48px.
- Color contrast AA (4.5:1) minimum.
- Keyboard navigable; ARIA labels on interactive elements.
- No horizontal scroll; tested at 320px width.
- `font-display: swap` on all fonts.
