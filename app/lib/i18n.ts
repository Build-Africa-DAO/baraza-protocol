/**
 * Baraza i18n — lightweight, no framework.
 *
 * Swahili (sw) is the PRIMARY language for the join + community flows.
 * English (en) is the FALLBACK when a key is missing in sw.
 *
 * IMPORTANT: A native-speaker review is strongly recommended before public
 * launch. The Swahili here is natural Kenyan register, not literal
 * machine translation, but it has not been validated by a fluent
 * community member.
 *
 * Usage:
 *   import { t } from "@/app/lib/i18n";
 *   t("hero.cta.browse")  // returns Swahili string, English fallback
 */

const sw: Record<string, string> = {
  // ── Hero ────────────────────────────────────────────────────────────────
  "hero.eyebrow": "Baraza Protocol",
  "hero.headline": "Msingi wa kikundi chako cha",
  "hero.rotating.fund": "mfuko wa pamoja",
  "hero.rotating.sacco": "SACCO",
  "hero.rotating.group": "kikundi",
  "hero.sub":
    "Anza mfuko wa pamoja, piga kura, chapisha kazi, na uweke akiba yenu wazi kwa wanachama wote — imetengenezwa kwa jumuiya kote Afrika.",
  "hero.cta.browse": "Tazama vikundi →",
  "hero.cta.start": "Anza kikundi",
  "hero.cta.bounties": "Ona Kazi",
  "hero.chama.link": "Unatafuta Chama? Tunayo.",

  // ── Feature cards ────────────────────────────────────────────────────────
  "feature.vote.title": "Piga kura",
  "feature.vote.sub": "Maamuzi ya pamoja",
  "feature.save.title": "Weka akiba",
  "feature.save.sub": "Mfuko wa pamoja",
  "feature.bounties.title": "Kazi",
  "feature.bounties.sub": "Kazi zenye malipo",

  // ── Nav ──────────────────────────────────────────────────────────────────
  "nav.about": "Kuhusu",
  "nav.explore": "Gundua",
  "nav.bounties": "Kazi",
  "nav.evaluate": "Tathmini",
  "nav.launch": "Anza",
  "nav.profile": "Wasifu",
  "nav.inbox": "Ujumbe",

  // ── Section ──────────────────────────────────────────────────────────────
  "section.discover.eyebrow": "Gundua",
  "section.discover.heading": "Vikundi na Chama",
  "section.discover.sub":
    "Tafuta kikundi cha kujiunga, au gundua Chama — ni jumuiya tofauti kwenye Baraza",

  // ── Tabs ─────────────────────────────────────────────────────────────────
  "tab.groups": "Vikundi",
  "tab.chamas": "Chama",
  "tab.bounties": "Kazi",
  "tab.contributors": "Wachangiaji",

  // ── Footer ────────────────────────────────────────────────────────────────
  "footer.tagline":
    "Mfumo wa akiba ya pamoja kwa jumuiya zinazokusanya michango, kupiga kura, na kusimamia fedha zao.",
  "footer.browse.groups": "Tazama vikundi",
  "footer.browse.chamas": "Tazama Chama",
  "footer.start.group": "Anza kikundi",
  "footer.start.chama": "Anza Chama",
  "footer.evaluate": "Tathmini Mbinu Bora",
  "footer.how": "Jinsi Inavyofanya Kazi",
  "footer.copyright": "© 2025 Baraza Protocol. Haki zote zimehifadhiwa.",
  "footer.built": "Imetengenezwa kwa jumuiya Afrika",

  // ── Login / Auth ─────────────────────────────────────────────────────────
  "login.title": "Karibu Baraza",
  "login.sub": "Endelea kwenye jumuiya yako.",
  "login.google.hint": "Wengi hutumia Google — ni rahisi zaidi.",
  "login.or.phone": "au tumia simu yako",
  "login.or.email": "au tumia barua pepe yako",
  "login.phone.placeholder": "712 345 678",
  "login.send": "Tuma nambari →",
  "login.sending": "Inatuma…",
  "login.use.email": "Tumia barua pepe badala yake",
  "login.use.phone": "Tumia simu badala yake",
  "login.terms": "Kwa kuendelea unakubali masharti na sera yetu ya faragha.",
  "login.verify.title": "Ingiza nambari",
  "login.verify.sub": "Tulituma kwenda",
  "login.verify.cta": "Thibitisha",
  "login.verifying": "Inakagua…",
  "login.change.number": "Badilisha nambari",
  "login.change.email": "Badilisha barua pepe",
  "login.resend": "Tuma tena",
  "login.resend.wait": "Tuma tena baada ya 0:",
  "login.error.code": "Nambari hiyo haikufanya kazi. Jaribu tena au tuma upya.",
  "login.error.phone": "Angalia nambari yako na ujaribu tena.",
  "login.error.email": "Angalia barua pepe yako na ujaribu tena.",
  "login.error.google": "Haikuwezekana kuendelea na Google. Jaribu simu yako badala yake.",

  // ── Dashboard ────────────────────────────────────────────────────────────
  "dashboard.welcome": "Karibu Baraza",
  "dashboard.coming": "Dashibodi yako inakuja.",

  // ── TopDAOs / Groups ─────────────────────────────────────────────────────
  "groups.search.placeholder": "Tafuta kwa jina...",
  "groups.start": "Anza kikundi",
  "groups.featured": "Jumuiya Iliyoangaziwa",
  "groups.count.singular": "kikundi kimepatikana",
  "groups.count.plural": "vikundi vimepatikana",
  "groups.members": "Wanachama",
  "groups.fund": "Mfuko wa pamoja",
  "groups.decisions": "Maamuzi",
  "groups.join": "Jiunge",
  "groups.view": "Ona wasifu",
  "groups.empty": "Hakuna vikundi vinavyolingana na utafutaji wako.",

  // ── Chamas ────────────────────────────────────────────────────────────────
  "chamas.search.placeholder": "Tafuta chama...",
  "chamas.start": "Anza Chama",
  "chamas.featured": "Chama Kilichoangaziwa",
  "chamas.count.singular": "chama kimepatikana",
  "chamas.count.plural": "chama zimepatikana",
  "chamas.members": "Wanachama",
  "chamas.fund": "Mfuko wa pamoja",
  "chamas.cycle": "Mkutano",
  "chamas.join": "Jiunge na chama hiki",
  "chamas.view": "Ona wasifu",
  "chamas.empty": "Hakuna chama zinazowiana na utafutaji wako.",
};

const en: Record<string, string> = {
  // ── Hero ────────────────────────────────────────────────────────────────
  "hero.eyebrow": "Baraza Protocol",
  "hero.headline": "The operating layer for your",
  "hero.rotating.fund": "community fund",
  "hero.rotating.sacco": "SACCO",
  "hero.rotating.group": "group",
  "hero.sub":
    "Start a community fund, post bounties, run votes, and keep your shared savings visible to every member — built for communities across Africa.",
  "hero.cta.browse": "Browse groups →",
  "hero.cta.start": "Start a group",
  "hero.cta.bounties": "View Bounties",
  "hero.chama.link": "Looking for a Chama? We have those too.",

  // ── Feature cards ────────────────────────────────────────────────────────
  "feature.vote.title": "Vote",
  "feature.vote.sub": "Shared decisions",
  "feature.save.title": "Save",
  "feature.save.sub": "Community fund",
  "feature.bounties.title": "Bounties",
  "feature.bounties.sub": "Paid tasks",

  // ── Nav ──────────────────────────────────────────────────────────────────
  "nav.about": "About",
  "nav.explore": "Explore",
  "nav.bounties": "Bounties",
  "nav.evaluate": "Evaluate",
  "nav.launch": "Launch",
  "nav.profile": "Profile",
  "nav.inbox": "Inbox",

  // ── Section ──────────────────────────────────────────────────────────────
  "section.discover.eyebrow": "Discover",
  "section.discover.heading": "Groups & Chamas",
  "section.discover.sub":
    "Find a group to join, or explore Chamas — they are different communities on Baraza",

  // ── Tabs ─────────────────────────────────────────────────────────────────
  "tab.groups": "Groups",
  "tab.chamas": "Chamas",
  "tab.bounties": "Bounties",
  "tab.contributors": "Contributors",

  // ── Footer ────────────────────────────────────────────────────────────────
  "footer.tagline":
    "A shared savings layer for communities that collect dues, raise decisions, and move their own funds together.",
  "footer.browse.groups": "Browse groups",
  "footer.browse.chamas": "Browse Chamas",
  "footer.start.group": "Start a group",
  "footer.start.chama": "Start a Chama",
  "footer.evaluate": "Evaluate Best Practice",
  "footer.how": "How it Works",
  "footer.copyright": "© 2025 Baraza Protocol. All rights reserved.",
  "footer.built": "Built for communities in Africa",

  // ── Login / Auth ─────────────────────────────────────────────────────────
  "login.title": "Welcome to Baraza",
  "login.sub": "Continue to your community.",
  "login.google.hint": "Most people use Google — it's the fastest.",
  "login.or.phone": "or use your phone",
  "login.or.email": "or use your email",
  "login.phone.placeholder": "712 345 678",
  "login.send": "Send code →",
  "login.sending": "Sending…",
  "login.use.email": "Use email instead",
  "login.use.phone": "Use phone instead",
  "login.terms": "By continuing you agree to our terms and privacy policy.",
  "login.verify.title": "Enter the code",
  "login.verify.sub": "We sent it to",
  "login.verify.cta": "Verify",
  "login.verifying": "Checking…",
  "login.change.number": "Change number",
  "login.change.email": "Change email",
  "login.resend": "Resend code",
  "login.resend.wait": "Resend in 0:",
  "login.error.code": "That code didn't work. Try again or resend.",
  "login.error.phone": "Check your number and try again.",
  "login.error.email": "Check your email and try again.",
  "login.error.google": "Couldn't continue with Google. Try your phone instead.",

  // ── Dashboard ────────────────────────────────────────────────────────────
  "dashboard.welcome": "Welcome to Baraza",
  "dashboard.coming": "Your dashboard is coming.",

  // ── TopDAOs / Groups ─────────────────────────────────────────────────────
  "groups.search.placeholder": "Search by name...",
  "groups.start": "Start a group",
  "groups.featured": "Featured Community",
  "groups.count.singular": "group found",
  "groups.count.plural": "groups found",
  "groups.members": "Members",
  "groups.fund": "Community fund",
  "groups.decisions": "Decisions",
  "groups.join": "Become a member",
  "groups.view": "View profile",
  "groups.empty": "No groups match your search.",

  // ── Chamas ────────────────────────────────────────────────────────────────
  "chamas.search.placeholder": "Search chamas...",
  "chamas.start": "Start a Chama",
  "chamas.featured": "Featured Chama",
  "chamas.count.singular": "Chama found",
  "chamas.count.plural": "Chamas found",
  "chamas.members": "Members",
  "chamas.fund": "Community fund",
  "chamas.cycle": "Meetings",
  "chamas.join": "Join this chama",
  "chamas.view": "View profile",
  "chamas.empty": "No chamas match your search.",
};

/**
 * Returns the Swahili string for `key`, falling back to English if absent.
 * If neither exists the key itself is returned so missing strings are visible.
 */
export function t(key: string): string {
  return sw[key] ?? en[key] ?? key;
}

export { sw, en };
