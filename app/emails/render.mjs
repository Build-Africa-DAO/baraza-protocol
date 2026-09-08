#!/usr/bin/env node
/**
 * Baraza transactional email templates.
 * Run: node emails/render.mjs
 *
 * Writes:
 *   emails/html/*.html          Handlebars placeholders for SendGrid
 *   emails/text/*.txt           Plain-text parts
 *   emails/catalog.json         Subjects + variables for backend
 *   public/emails/preview/*.html  Filled samples
 *   public/emails/index.html      Gallery
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, '../public/emails');

const C = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  orange: '#F97316',
  muted: '#525252',
  line: '#E5E5E5',
  page: '#F5F5F5',
  radius: '16px',
};

const SITE = 'https://barazaprotocol.com';
const SUPPORT = 'hello@barazaprotocol.com';
const LOGO_URL = 'https://www.barazaprotocol.com/logo';

const SAMPLE = {
  otp: '482917',
  expires_minutes: '10',
  email: 'amani@example.com',
  first_name: 'Amani',
  device: 'iPhone 15',
  browser: 'Safari 18.3',
  location: 'Nairobi, Kenya',
  signed_in_at: '7 Sep 2026, 16:02 EAT',
  community_name: 'Umoja Chama',
  proposal_title: 'Release KES 40,000 for school fees',
  decision: 'FOR',
  amount_label: 'KES 1,200',
  due_date: '15 Sep 2026',
  admin_phone: '+254 712 345 678',
  action_url: `${SITE}/communities`,
  inviter_name: 'Wanjiku Muthoni',
  recipient_name: 'Grace Otieno',
  payout_id: 'PO-1842',
  year: '2026',
  support_email: SUPPORT,
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fill(html, data) {
  return html.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key) => {
    if (!(key in data)) return `{{${key}}}`;
    return esc(data[key]);
  });
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:8px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:${C.muted};width:34%;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;font-size:15px;font-weight:600;color:${C.black};text-align:left;">${value}</td>
    </tr>`;
}

function sessionBlock() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px auto 0;max-width:360px;border:1px solid ${C.line};border-radius:${C.radius};">
      <tr>
        <td style="padding:18px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${row('Device', '{{device}}')}
            ${row('Browser', '{{browser}}')}
            ${row('Location', '{{location}}')}
            ${row('Time', '{{signed_in_at}}')}
          </table>
        </td>
      </tr>
    </table>`;
}

function otpBlock() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 0;">
      <tr>
        <td align="center" style="border:1px solid ${C.black};border-radius:${C.radius};padding:22px 36px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${C.orange};">Your code</p>
          <p style="margin:0;font-family:ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace;font-size:32px;line-height:1.2;font-weight:800;letter-spacing:0.36em;color:${C.black};padding-left:0.36em;">{{otp}}</p>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0;font-size:13px;line-height:22px;color:${C.muted};text-align:center;">Expires in {{expires_minutes}} minutes.</p>`;
}

function cta(label, href) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 0;">
      <tr>
        <td align="center" bgcolor="${C.black}" style="background:${C.black};border-radius:9999px;">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;letter-spacing:0.04em;color:${C.white};text-decoration:none;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function layout({ preheader, inner, footerNote, logoSrc = LOGO_URL }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Baraza</title>
</head>
<body style="margin:0;padding:0;background:${C.page};color:${C.black};font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${C.page};">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 18px;">
              <img src="${logoSrc}" width="48" height="48" alt="Baraza" style="display:block;margin:0 auto 10px;border:0;width:48px;height:48px;border-radius:11px;">
              <p style="margin:0;font-size:18px;font-weight:800;letter-spacing:-0.03em;color:${C.black};text-align:center;">
                <span style="color:${C.orange};">Baraza</span> Protocol
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:${C.white};border:1px solid ${C.line};border-radius:${C.radius};overflow:hidden;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="height:4px;line-height:4px;font-size:0;background:${C.orange};">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" style="padding:36px 32px 40px;text-align:center;">
                    ${inner}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 12px 0;">
              <p style="margin:0;font-size:12px;line-height:20px;color:${C.muted};">
                Baraza Protocol. <a href="${SITE}" style="color:${C.black};text-decoration:none;">barazaprotocol.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:12px;line-height:20px;color:${C.muted};">
                ${footerNote}
              </p>
              <p style="margin:8px 0 0;font-size:12px;line-height:20px;color:${C.muted};">
                Questions? ${SUPPORT}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function copy({ eyebrow, title, body, extra = '', button }) {
  const paragraphs = (Array.isArray(body) ? body : [body])
    .map((p) => `<p style="margin:14px auto 0;max-width:420px;font-size:15px;line-height:24px;color:${C.muted};text-align:center;">${p}</p>`)
    .join('');
  return `
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.orange};text-align:center;">${eyebrow}</p>
    <h1 style="margin:12px 0 0;font-size:26px;line-height:32px;font-weight:800;letter-spacing:-0.03em;color:${C.black};text-align:center;">${title}</h1>
    ${paragraphs}
    ${extra}
    ${button ?? ''}`;
}

const templates = [
  {
    id: 'signup-otp',
    name: 'Sign up code',
    group: 'Auth',
    subject: 'Your Baraza code',
    vars: ['otp', 'expires_minutes', 'email'],
    preheader: 'Your Baraza code is {{otp}}. It expires in {{expires_minutes}} minutes.',
    footerNote: 'We sent this to {{email}} because someone started creating a Baraza account.',
    text: `Baraza Protocol

Your Baraza code

{{otp}}

Type this code in the app to create your account. It expires in {{expires_minutes}} minutes.

If you did not ask for this code, ignore this email. We will not ask you for it on a call or in chat.`,
    inner: copy({
      eyebrow: 'Create account',
      title: 'Your Baraza code',
      body: [
        'Type this code in the app to create your account.',
        'If you did not ask for this code, ignore this email. We will not ask you for it on a call or in chat.',
      ],
      extra: otpBlock(),
    }),
  },
  {
    id: 'signin-otp',
    name: 'Sign in code',
    group: 'Auth',
    subject: 'Your Baraza sign in code',
    vars: ['otp', 'expires_minutes', 'email', 'device', 'browser', 'location', 'signed_in_at'],
    preheader: 'Your sign in code is {{otp}}. This request came from {{device}} in {{location}}.',
    footerNote: 'We sent this to {{email}} because someone tried to sign in to this Baraza account.',
    text: `Baraza Protocol

Your Baraza sign in code

{{otp}}

Expires in {{expires_minutes}} minutes.

This request came from:
Device: {{device}}
Browser: {{browser}}
Location: {{location}}
Time: {{signed_in_at}}

If this was not you, ignore this email and do not share the code.`,
    inner: copy({
      eyebrow: 'Sign in',
      title: 'Your sign in code',
      body: [
        'Type this code in the app to sign in.',
        'This request came from the device below. If it was not you, do not share the code.',
      ],
      extra: `${otpBlock()}${sessionBlock()}`,
    }),
  },
  {
    id: 'signin-new-session',
    name: 'New sign in',
    group: 'Auth',
    subject: 'New sign in to your Baraza account',
    vars: ['email', 'device', 'browser', 'location', 'signed_in_at', 'action_url'],
    preheader: 'New sign in from {{device}}, {{browser}}, {{location}}.',
    footerNote: 'We sent this to {{email}} after a sign in to your Baraza account.',
    text: `Baraza Protocol

New sign in to your account

Device: {{device}}
Browser: {{browser}}
Location: {{location}}
Time: {{signed_in_at}}

If this was you, you can ignore this email.
If this was not you, open ${SITE} and write to ${SUPPORT}.`,
    inner: copy({
      eyebrow: 'Account',
      title: 'New sign in to your account',
      body: [
        'Your Baraza account was just signed in. Check the details below.',
        'If this was you, you can ignore this email. If it was not you, open your account and write to ' + SUPPORT + '.',
      ],
      extra: sessionBlock(),
      button: cta('Open account', '{{action_url}}'),
    }),
  },
  {
    id: 'account-welcome',
    name: 'Account created',
    group: 'Auth',
    subject: 'Welcome to Baraza',
    vars: ['first_name', 'email', 'action_url'],
    preheader: 'Your Baraza account is ready. You can start a group or join one.',
    footerNote: 'We sent this to {{email}} because this address just created a Baraza account.',
    text: `Baraza Protocol

Welcome to Baraza

Hi {{first_name}}. Your account is ready. You can start a group or join one. Pay dues on M-Pesa. Vote with the rest of the members. We do not give you a seed phrase.

Open Baraza: {{action_url}}`,
    inner: copy({
      eyebrow: 'Welcome',
      title: 'Welcome to Baraza',
      body: [
        'Hi {{first_name}}. Your account is ready.',
        'You can start a group or join one. Pay dues on M-Pesa. Vote with the rest of the members. We do not give you a seed phrase.',
      ],
      button: cta('Open Baraza', '{{action_url}}'),
    }),
  },
  {
    id: 'vote-cast',
    name: 'Vote recorded',
    group: 'Notifications',
    subject: 'Your vote in {{community_name}} was recorded',
    vars: ['community_name', 'proposal_title', 'decision', 'action_url', 'email'],
    preheader: 'You voted {{decision}} on "{{proposal_title}}".',
    footerNote: 'We sent this to {{email}} because you voted in {{community_name}}.',
    text: `Baraza Protocol

Your vote {{decision}} on "{{proposal_title}}" in {{community_name}} has been recorded.

See the tally: {{action_url}}`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'We recorded your vote',
      body: [
        'You voted <strong style="color:' + C.black + ';">{{decision}}</strong> on "{{proposal_title}}".',
        'Open the proposal to see the tally. Other members can see it too.',
      ],
      button: cta('See the tally', '{{action_url}}'),
    }),
  },
  {
    id: 'dues-reminder',
    name: 'Dues reminder',
    group: 'Notifications',
    subject: 'Dues reminder for {{community_name}}',
    vars: ['community_name', 'amount_label', 'due_date', 'action_url', 'email'],
    preheader: '{{amount_label}} is due by {{due_date}} for {{community_name}}.',
    footerNote: 'We sent this to {{email}} because you are a member of {{community_name}}.',
    text: `Baraza Protocol

Dues reminder for {{community_name}}

{{amount_label}} is due by {{due_date}}.

Pay in the app: {{action_url}}
Or dial *384#`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'Dues are due',
      body: [
        '<strong style="color:' + C.black + ';">{{amount_label}}</strong> is due by {{due_date}}.',
        'Pay in the app or dial *384#.',
      ],
      button: cta('Pay dues', '{{action_url}}'),
    }),
  },
  {
    id: 'member-welcome',
    name: 'Membership active',
    group: 'Notifications',
    subject: 'You are a member of {{community_name}}',
    vars: ['community_name', 'admin_phone', 'action_url', 'email'],
    preheader: 'Your membership in {{community_name}} is active.',
    footerNote: 'We sent this to {{email}} because your membership in {{community_name}} is now active.',
    text: `Baraza Protocol

You are a member of {{community_name}}. Your membership is active.

Pay dues, vote, and read the ledger with the rest of the group.
Admin: {{admin_phone}}
Open the group: {{action_url}}
Or dial *384#`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'Your membership is active',
      body: [
        'You can pay dues, vote, and read the ledger with the rest of the group.',
        'If you need help, the admin is {{admin_phone}}.',
      ],
      button: cta('Open group', '{{action_url}}'),
    }),
  },
  {
    id: 'proposal-created',
    name: 'New proposal',
    group: 'Notifications',
    subject: 'New proposal in {{community_name}}',
    vars: ['community_name', 'proposal_title', 'action_url', 'email'],
    preheader: 'New proposal: "{{proposal_title}}".',
    footerNote: 'We sent this to {{email}} because you are a member of {{community_name}}.',
    text: `Baraza Protocol

New proposal in {{community_name}}:

"{{proposal_title}}"

Vote in the app: {{action_url}}
Or dial *384#`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'A new proposal is open',
      body: [
        '"{{proposal_title}}"',
        'Vote in the app or dial *384#.',
      ],
      button: cta('Read and vote', '{{action_url}}'),
    }),
  },
  {
    id: 'payment-confirmed',
    name: 'Payment confirmed',
    group: 'Notifications',
    subject: 'Payment confirmed for {{community_name}}',
    vars: ['community_name', 'amount_label', 'action_url', 'email'],
    preheader: '{{amount_label}} confirmed for {{community_name}}.',
    footerNote: 'We sent this to {{email}} because a payment for {{community_name}} cleared.',
    text: `Baraza Protocol

We received {{amount_label}} for {{community_name}}. Your membership is active.

Open the group: {{action_url}}`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'We received your payment',
      body: [
        '<strong style="color:' + C.black + ';">{{amount_label}}</strong> is confirmed. Your membership is active.',
        'Open the group to see it on the ledger.',
      ],
      button: cta('View membership', '{{action_url}}'),
    }),
  },
  {
    id: 'membership-activate',
    name: 'Activate membership',
    group: 'Notifications',
    subject: 'Activate your {{community_name}} membership',
    vars: ['community_name', 'amount_label', 'action_url', 'email'],
    preheader: 'We received your dues payment. Open the link to finish activating.',
    footerNote: 'We sent this to {{email}} after a dues payment for {{community_name}}.',
    text: `Baraza Protocol

We received your dues payment for {{community_name}} ({{amount_label}}).

Open this link to attach the membership to your Baraza account:
{{action_url}}`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'Finish activating your membership',
      body: [
        'We received your dues payment of {{amount_label}}.',
        'Open the link below to attach this membership to your Baraza account.',
      ],
      button: cta('Activate membership', '{{action_url}}'),
    }),
  },
  {
    id: 'community-invite',
    name: 'Group invite',
    group: 'Notifications',
    subject: '{{inviter_name}} invited you to {{community_name}}',
    vars: ['community_name', 'inviter_name', 'action_url', 'email'],
    preheader: '{{inviter_name}} invited you to {{community_name}} on Baraza.',
    footerNote: 'We sent this to {{email}} because {{inviter_name}} invited you to {{community_name}}.',
    text: `Baraza Protocol

{{inviter_name}} invited you to {{community_name}} on Baraza.

Join here: {{action_url}}`,
    inner: copy({
      eyebrow: 'Invite',
      title: 'Join {{community_name}}',
      body: [
        '{{inviter_name}} invited you.',
        'You will see dues, votes, and payouts with the other members.',
      ],
      button: cta('Join the group', '{{action_url}}'),
    }),
  },
  {
    id: 'payout-approval',
    name: 'Payout needs approval',
    group: 'Notifications',
    subject: 'Payout needs your approval in {{community_name}}',
    vars: ['community_name', 'amount_label', 'recipient_name', 'payout_id', 'action_url', 'email'],
    preheader: '{{amount_label}} to {{recipient_name}} is waiting for your approval.',
    footerNote: 'We sent this to {{email}} because you are an officer of {{community_name}}.',
    text: `Baraza Protocol

A payout in {{community_name}} needs your approval.

Amount: {{amount_label}}
Recipient: {{recipient_name}}
Reference: {{payout_id}}

Review: {{action_url}}`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'This payout needs your approval',
      body: [
        '<strong style="color:' + C.black + ';">{{amount_label}}</strong> to {{recipient_name}} is waiting.',
        'Reference {{payout_id}}. Open it to approve or reject.',
      ],
      button: cta('Review payout', '{{action_url}}'),
    }),
  },
  {
    id: 'payout-settled',
    name: 'Payout settled',
    group: 'Notifications',
    subject: 'Payout settled for {{community_name}}',
    vars: ['community_name', 'amount_label', 'recipient_name', 'payout_id', 'action_url', 'email'],
    preheader: '{{amount_label}} to {{recipient_name}} has settled.',
    footerNote: 'We sent this to {{email}} because a payout in {{community_name}} settled.',
    text: `Baraza Protocol

Payout settled in {{community_name}}.

Amount: {{amount_label}}
Recipient: {{recipient_name}}
Reference: {{payout_id}}

Ledger: {{action_url}}`,
    inner: copy({
      eyebrow: '{{community_name}}',
      title: 'This payout went through',
      body: [
        '<strong style="color:' + C.black + ';">{{amount_label}}</strong> to {{recipient_name}} has settled.',
        'Reference {{payout_id}}. Open the ledger to see it.',
      ],
      button: cta('View ledger', '{{action_url}}'),
    }),
  },
];


function previewIndex(items) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Baraza email templates</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0A0A0A; color: #fff; }
    .app { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
    aside { padding: 28px 18px; border-right: 1px solid #1f1f1f; }
    h1 { margin: 0 0 6px; font-size: 18px; letter-spacing: -0.03em; }
    .sub { margin: 0 0 22px; font-size: 12px; color: #A3A3A3; }
    .label { margin: 18px 0 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #F97316; }
    .nav-item { display: block; width: 100%; text-align: left; background: transparent; border: 0; color: #E5E5E5; padding: 10px 12px; margin: 0 0 4px; border-radius: 9999px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; }
    .nav-item:hover { background: #171717; }
    .nav-item.active { background: #F97316; color: #fff; }
    main { background: #F5F5F5; }
    iframe { width: 100%; height: 100vh; border: 0; background: #F5F5F5; }
    @media (max-width: 800px) {
      .app { grid-template-columns: 1fr; }
      iframe { height: calc(100vh - 220px); }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside>
      <h1>Baraza emails</h1>
      <p class="sub">${items.length} templates. Black, white, orange</p>
      ${['Auth', 'Notifications'].map((group) =>
        `<p class="label">${group}</p>${items.filter((t) => t.group === group).map((t, i) => {
          const first = group === 'Auth' && i === 0;
          return `<button type="button" class="nav-item${first ? ' active' : ''}" data-src="./preview/${t.id}.html">${esc(t.name)}</button>`;
        }).join('')}`,
      ).join('')}
    </aside>
    <main>
      <iframe id="frame" title="Email preview" src="./preview/${items[0].id}.html"></iframe>
    </main>
  </div>
  <script>
    const frame = document.getElementById('frame');
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        frame.src = btn.dataset.src;
      });
    });
  </script>
</body>
</html>
`;
}

function writeAll() {
  mkdirSync(join(root, 'html'), { recursive: true });
  mkdirSync(join(root, 'text'), { recursive: true });
  mkdirSync(join(publicDir, 'preview'), { recursive: true });

  const catalog = templates.map((t) => {
    const html = layout({
      preheader: t.preheader,
      inner: t.inner,
      footerNote: t.footerNote,
      logoSrc: LOGO_URL,
    });
    writeFileSync(join(root, 'html', `${t.id}.html`), html);
    writeFileSync(join(root, 'text', `${t.id}.txt`), `${t.subject}\n\n${t.text.trim()}\n`);
    writeFileSync(
      join(publicDir, 'preview', `${t.id}.html`),
      fill(layout({
        preheader: t.preheader,
        inner: t.inner,
        footerNote: t.footerNote,
        logoSrc: '/logo.png',
      }), SAMPLE),
    );
    return {
      id: t.id,
      name: t.name,
      group: t.group,
      subject: t.subject,
      variables: t.vars,
      html: `emails/html/${t.id}.html`,
      text: `emails/text/${t.id}.txt`,
    };
  });

  writeFileSync(
    join(root, 'catalog.json'),
    JSON.stringify(
      {
        from: 'Baraza Protocol <no-reply@barazaprotocol.com>',
        logo_url: LOGO_URL,
        support_email: SUPPORT,
        site_url: SITE,
        colors: C,
        templates: catalog,
      },
      null,
      2,
    ) + '\n',
  );

  writeFileSync(join(publicDir, 'index.html'), previewIndex(templates));
  console.log(`Wrote ${templates.length} email templates.`);
}

writeAll();
