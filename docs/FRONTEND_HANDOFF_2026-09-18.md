# Frontend changes on 18 September 2026 and what the backend needs to add

**From:** Eugene (frontend) · **To:** Simon (backend) · **Branch:** `front-end`, merged with `dev` at PR #94 (commit `df5aa23`); lands as one PR to `dev`
**Context:** PR #93 (production polish against BRZ-FE-SPEC-2026-001) is already on `dev`. Everything below is on top of it. The frontend never invents data: where a backend field or endpoint does not exist yet, the screen keeps working from local state and says so. This document lists exactly what is missing so those fallbacks can be removed.

---

## 1. What changed on the frontend

### 1.1 Join a group (`/join/:id`, `/join/:id/status`)
- **Layout.** Content widened from 672 px to 896 px; the group identity (initials or logo, name, type chip, "Joining" chip) sits on one centred row; the voting-rules sentence, step titles and step descriptions are centred.
- **Fee breakdown as four cards in a row:** Activation fee, Baraza platform fee (2.0%), Carrier processing cost, Total. The Total card is filled system orange in both themes. No outlines; the site's card depth style.
- **Payment method chooser.** A "Payment Options" column with four selectable cards, M-Pesa selected by default: **M-Pesa** (Safaricom STK), **Airtel Money**, **Card / Bank** (Mastercard / Visa via Paystack), **Crypto** (Stellar XLM / USDC). Selecting a card switches the heading, helper text, input fields (phone for mobile money, email for card, transaction hash for crypto) and the primary button. Official logos: `public/logos/mpesa.svg`, `airtel.svg` (embeds `airtel-money.png`), `mastercard.svg`, `stellar.svg` (inverted in dark mode).
- **Status page** reads `?rail=mpesa|airtel|card|stellar` and phrases the confirming step per rail.

Files: `src/pages/JoinDao.tsx`, `src/pages/JoinStatus.tsx`, `src/components/app/IdentityStrip.tsx`, `src/index.css` (3D card tokens and `.baraza-card-3d`), `public/logos/*`.

### 1.2 Start a group (`/create`)
Step titles and descriptions ("What Kind of Group? Step 1 of 3" …) and the "What Members Pay" / "Who Must Vote" section headers are centred. `PageHeader` gained a `centered` prop.

Files: `src/pages/CreateCommunity.tsx`, `src/components/ui/page-header.tsx`.

### 1.3 Account (`/account`)
- Identity strip (photo or initials, name, country, "Signed In") sits to the right of the "Account" title.
- "Save", the "Your Groups" title and "Enable Push" are centred; the Notifications card centres its content vertically.
- **Log Out removed from this page.** It lives only in the top bar account menu, and lands on the homepage.
- **Profile photo upload** (see 1.5).

Files: `src/pages/Profile.tsx`, `src/pages/__tests__/Profile.test.tsx` (new).

### 1.4 Group settings (`/dashboard/:id/settings`)
New **Group Logo** row at the top of Group Identity: officers click the tile to upload; "Remove custom logo" reverts to initials. Members see the logo read-only.

Files: `src/pages/GroupSettings.tsx`.

### 1.5 Profile photo and group logo everywhere
A person can change their photo (Account page, top bar account menu) and an officer can change the group logo (Settings, group header). The change shows immediately in every place the tile appears:

| Surface | Photo | Group logo |
|---|---|---|
| Top bar account button and menu | ✓ | |
| Account page header and Name card | ✓ | |
| People directory (own row) | ✓ | |
| Officers list in Settings (own row) | ✓ | |
| Group header on every group page | | ✓ |
| Sidebar group list (signed-in shell) | | ✓ |
| My Groups rows, Browse cards, Join page | | ✓ |

How it works today: `src/lib/imageUpload.ts` resizes the picked file to ≤ 400 px and stores it as a data URL in `localStorage` (`baraza.userAvatar.v1`, `baraza.communityImage.<id>`), and broadcasts a window event so every open tile re-renders. The photo is also sent to `PATCH /api/user/profile` as `avatarUrl`; the group logo is sent nowhere because nothing accepts it (see §2).

Files: `src/lib/imageUpload.ts` (new), `src/lib/__tests__/imageUpload.test.tsx` (new), `src/components/app/ListRow.tsx` (`InitialsTile` gained `image`, `editable`, `onImageChange`, and resets its failed-image flag when the source changes), `IdentityStrip.tsx`, `TopBarMenus.tsx`, `GroupWorkspace.tsx`, `AppShell.tsx`, `GroupRow.tsx`, `CommunityCard.tsx`, `MemberDirectory.tsx`, `GroupSettings.tsx`, `JoinDao.tsx`, `Profile.tsx`.

### 1.6 Signed-in shell and group header
- Sidebar sections (My Groups, Browse, Start a Group) are collapsible with a chevron; open by default for a person with no groups, closed once they have one; state remembered per browser. The sidebar collapse toggle moved from the top bar into the sidebar header.
- Group pages: the back link and the group identity share one row; page titles sit on the right of that row instead of a second header.

Files: `src/components/app/AppShell.tsx`, `src/components/app/__tests__/AppShell.test.tsx` (new), `src/components/app/GroupWorkspace.tsx`.

### 1.7 Toasts and shadows
- Toasts are theme-aware cards (white in light, 9% grey in dark), no outline, no orange top edge, deep shadow; the destructive variant colours only the title red.
- Fixed a silent styling bug: every `shadow-[var(--shadow-…)]` class compiled to no shadow because Tailwind reads a bare variable as a colour. `shadow-card`, `shadow-card-hover` and `shadow-deep` are now named utilities in `tailwind.config.js`, so the top bar, sidebar, bottom nav, sheets, menus and toasts have real depth for the first time.
- `/dev/ui` has a Toasts fixture.

Files: `src/components/ui/toast.tsx`, `tailwind.config.js`, 12 files that used the old class, `src/pages/DevUi.tsx`.

### 1.8 Verification
Typecheck clean (both configs), `eslint .` 0 errors, 269 frontend tests across 31 files, production build green, browser pass in both themes at 1280 px and 375 px (Join with all four payment methods, group header, Browse, Settings, Account fixtures, toasts, logo propagation across pages).

---

## 2. What the backend needs to do

Ordered by how much of the frontend is waiting on it.

### 2.1 Profile photo storage (blocks 1.5 for photos)
`PATCH /api/user/profile` validates `avatarUrl` with `assertValidHttpsUrl`, so the data URL the browser produces is rejected with 400 and the photo survives only in that browser's storage.

Ask:
1. `POST /api/user/avatar` — session bearer; body `multipart/form-data` with `file` (JPEG/PNG/WebP, ≤ 2 MB) **or** JSON `{ "dataUrl": "data:image/jpeg;base64,…" }`; stores to Supabase Storage (public bucket `avatars/<user_id>.<ext>`), writes `user_profiles.avatar_url`, returns `{ "avatarUrl": "https://…" }`. `DELETE /api/user/avatar` clears it.
2. Keep `PATCH /api/user/profile` accepting only https `avatarUrl` (the frontend will switch to calling 2.1.1 first, then PATCH the returned URL, then drop the local copy).
3. `GET /api/user/profile` already returns `avatar_url`, and since PR #94 `GET /api/communities/members` returns `avatarUrl` per member. The frontend mapper in `src/lib/communities.ts` (`fetchCommunityMembers`) drops it today; we will carry it onto `Member` so the People directory shows everyone's photo once 2.1.1 gives those URLs somewhere to live. The officers list (`GET /api/communities/officers`) should return `avatarUrl` too.

### 2.2 Group logo storage (blocks 1.5 for logos)
There is no `communities.image_url` column and no write endpoint (the mapper in `src/lib/communities.ts` notes the column was never created; the frontend derives initials from the name).

Ask:
1. Migration: `communities.image_url text null`.
2. `POST /api/communities/:id/logo` — officer session; same body options as 2.1.1; bucket `community-logos/<community_id>.<ext>`; writes `image_url`; returns `{ "imageUrl": "https://…" }`. `DELETE /api/communities/:id/logo` clears it.
3. Include `image_url` in every community payload: `GET /api/communities`, `GET /api/communities/:id`, `GET /api/user/memberships`, and the join page's community fetch. The frontend will map it to `community.image` and stop reading local storage.

### 2.3 Real Airtel Money and card rails (blocks 1.1 beyond the simulator)
The chooser is wired, but only M-Pesa and Stellar have real endpoints. PR #94 pointed the M-Pesa button at the live `POST /api/mpesa/stk-push` whenever the simulator is off, and the merge kept that. Today:
- **Airtel Money** posts to `POST /api/mpesa/simulate` with `rail: "airtel"` and lands on `/join/:id/status?rail=airtel`.
- **Card / Bank** posts to `POST /api/mpesa/simulate` with `channel: "card"` and an email, and lands on `?rail=card`.
Both only work with the dev simulator flag; in production the Airtel and card buttons show the "rail unavailable" copy. `api/payments/paystack.ts` and `api/payments/kotani.ts` exist but are internal proxies behind `PAYMENT_ADAPTER_PROXY_SECRET`, so the browser cannot call them.

Ask:
1. `POST /api/payments/airtel/stk` (or extend `POST /api/mpesa/stk-push` with `rail: "mpesa" | "airtel"`): body `{ communityId, phone, amountMinor, currency, purpose: "join" | "dues" }`; returns `{ orderId, activationSecret?, stkExpiresAt }`; same callback/status machinery as M-Pesa.
2. `POST /api/payments/card/checkout`: body `{ communityId, email, amountMinor, currency, purpose, returnUrl }`; initialises Paystack and returns `{ orderId, authorizationUrl }`; the frontend redirects to `authorizationUrl` and Paystack returns to `/join/:id/status?orderId=…&rail=card`. Webhook (`api/webhooks/paystack.ts` exists) confirms the order.
3. `GET /api/payment-orders/status` should return `rail` (`mpesa | airtel | card | stellar`) so the status page does not depend on the query string, plus `stkExpiresAt` for the 60-second countdown asked for in PR #93.
4. `GET /api/health/ready` components: add `airtel` and `paystack` alongside `stellar_horizon` so the health line on Join can speak per rail.

### 2.4 Carried over from PR #93 (unchanged, still open)
- Paybill number on the community row (Settings shows "Not Set"; Join fallback copy needs it).
- `settlement { chain, contracts_state }` on the community row for the EVM badge (FE-5.2).
- Payout quote endpoint in the group currency; statement or balances endpoint that splits reserved from available.

---

## 3. Contract summary the frontend will code against

```
POST   /api/user/avatar                    -> { avatarUrl }
DELETE /api/user/avatar                    -> 204
POST   /api/communities/:id/logo           -> { imageUrl }        (officer)
DELETE /api/communities/:id/logo           -> 204                 (officer)
GET    /api/communities/:id/members        -> [{ …, avatar_url }]
GET    /api/communities[/:id]              -> { …, image_url }
POST   /api/payments/airtel/stk            -> { orderId, activationSecret?, stkExpiresAt }
POST   /api/payments/card/checkout         -> { orderId, authorizationUrl }
GET    /api/payment-orders/status          -> { …, rail, stkExpiresAt? }
```

When any of these ship, ping the frontend: each has a single call site behind `src/lib/imageUpload.ts` or `src/pages/JoinDao.tsx`, and the local fallbacks come out the same day.
