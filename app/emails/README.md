# Baraza email templates

HTML and plain-text templates for custom auth and product mail. Simon interpolates Handlebars `{{variables}}` and sends them with SendGrid from `no-reply@barazaprotocol.com`.

Rebuild after edits:

```bash
node emails/render.mjs
```

Preview: [http://localhost:5173/emails/](http://localhost:5173/emails/)

## Look

- Black `#0A0A0A`, white `#FFFFFF`, orange `#F97316`
- Centered card, 16px radius
- Logo at the top, centered: `https://www.barazaprotocol.com/logo`
- OTP in its own outlined box, centered
- Sign in mail includes device, browser, location, and time

The logo URL is hardcoded. After this branch deploys, `/logo` serves the PNG (`public/logo.png` plus a rewrite). Until then, Gmail may hide the mark if the live URL still returns HTML.

## Templates

| ID | When to send | Subject |
|---|---|---|
| `signup-otp` | Sign up email code | Your Baraza code |
| `signin-otp` | Sign in email code | Your Baraza sign in code |
| `signin-new-session` | Successful sign in (email, Google, etc.) | New sign in to your Baraza account |
| `account-welcome` | First successful sign up | Welcome to Baraza |
| `vote-cast` | Member casts a vote | Your vote in {{community_name}} was recorded |
| `dues-reminder` | Dues cycle reminder | Dues reminder for {{community_name}} |
| `member-welcome` | Membership becomes active | You are a member of {{community_name}} |
| `proposal-created` | New proposal in a group | New proposal in {{community_name}} |
| `payment-confirmed` | Dues or activation payment clears | Payment confirmed for {{community_name}} |
| `membership-activate` | Payment received, account still needs linking | Activate your {{community_name}} membership |
| `community-invite` | Someone sends an invite | {{inviter_name}} invited you to {{community_name}} |
| `payout-approval` | Officer must approve a disbursement | Payout needs your approval in {{community_name}} |
| `payout-settled` | Payout lands | Payout settled for {{community_name}} |

See `catalog.json` for variables. Shared field: `email`. Auth codes also need `otp` and `expires_minutes`. Sign in templates need `device`, `browser`, `location`, `signed_in_at`.
