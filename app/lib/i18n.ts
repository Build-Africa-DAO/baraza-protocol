/**
 * Baraza i18n — lightweight, no framework.
 *
 * English (en) is the ACTIVE launch language. The Swahili (sw) dictionary is
 * retained in full but DORMANT — deferred to a later Swahili release. Nothing
 * was deleted; only the lookup order in t() selects en first.
 *
 * To re-enable Swahili later: flip the order in t() back to `sw[key] ?? en[key]`
 * (or add real locale state). The sw strings still need a native-speaker review
 * before they are shown to users.
 *
 * Usage:
 *   import { t } from "@/app/lib/i18n";
 *   t("hero.cta.browse")  // returns English string (sw fallback)
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

  // ── Bounties ──────────────────────────────────────────────────────────────
  "bounties.heading": "Kazi Zilizo Wazi",
  "bounties.subtitle.separator": "kazi",
  "bounties.subtitle.rewards": "katika zawadi",
  "bounties.search.placeholder": "Tafuta kazi...",
  "bounties.post": "Chapisha kazi",
  "bounties.submit": "Wasilisha kazi →",
  "bounties.filters.heading": "Vichujio",
  "bounties.filters.sort.label": "Panga",
  "bounties.filters.skills.label": "Ujuzi",
  "bounties.filters.skills.hint": "Bonyeza kuchuja kwa ujuzi",
  "bounties.filters.clear": "Futa",
  "bounties.filters.clear.all": "Futa vichujio vyote",
  "bounties.sort.newest": "Mpya zaidi",
  "bounties.sort.reward": "Zawadi kubwa zaidi",
  "bounties.sort.deadline": "Inafunga hivi karibuni",
  "bounties.stat.open": "Kazi zilizo wazi",
  "bounties.stat.total.rewards": "Jumla ya zawadi",
  "bounties.stat.avg.reward": "Wastani wa zawadi",
  "bounties.stat.closing.soon": "Inafunga hivi karibuni",
  "bounties.stat.skills.needed": "Ujuzi unaohitajika",
  "bounties.stat.urgent": "Haraka",
  "bounties.stat.categories": "aina",
  "bounties.deadline.suffix": "zimebaki",
  "bounties.days.one": "siku 1",
  "bounties.days.many": "siku",
  "bounties.submissions.one": "wasilisho 1",
  "bounties.submissions.many": "wasilisho",
  "bounties.status.open": "Wazi",
  "bounties.badge.hot": "Moto",
  "bounties.empty.text": "Hakuna kazi zinazowiana na vichujio vyako.",
  "bounties.posted.day": "siku 1 iliyopita",
  "bounties.posted.days": "siku zilizopita",
  "bounties.ago": "iliyopita",

  // ── Contributors ──────────────────────────────────────────────────────────
  "contributors.stat.members": "Jumla ya Wanachama",
  "contributors.stat.contributed": "Jumla Iliyochangiwa",
  "contributors.stat.avg": "Wastani kwa Mwanachama",
  "contributors.stat.leaders": "Viongozi",
  "contributors.search.placeholder": "Tafuta wanachama...",
  "contributors.role.all": "Wote",
  "contributors.role.founders": "Waanzilishi",
  "contributors.role.admins": "Wasimamizi",
  "contributors.role.members": "Wanachama",
  "contributors.sort.label": "Panga kwa:",
  "contributors.sort.contribution": "Mchango",
  "contributors.sort.joined": "Tarehe ya Kujiunga",
  "contributors.sort.name": "Jina",
  "contributors.sort.active": "Aliyechangia Hivi Karibuni",
  "contributors.joined": "Alijiunga",
  "contributors.ago": "iliyopita",
  "contributors.contributed": "amechangia",
  "contributors.col.votes": "Kura",
  "contributors.col.payments": "Malipo",
  "contributors.col.reputation": "Sifa",
  "contributors.empty": "Hakuna wachangiaji wanaowiana na vichujio vyako.",
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

  // ── Bounties ──────────────────────────────────────────────────────────────
  "bounties.heading": "Open Bounties",
  "bounties.subtitle.separator": "bounties",
  "bounties.subtitle.rewards": "in rewards",
  "bounties.search.placeholder": "Search bounties...",
  "bounties.post": "Post bounty",
  "bounties.submit": "Submit work →",
  "bounties.filters.heading": "Filters",
  "bounties.filters.sort.label": "Sort",
  "bounties.filters.skills.label": "Skills",
  "bounties.filters.skills.hint": "Click to filter by skill",
  "bounties.filters.clear": "Clear",
  "bounties.filters.clear.all": "Clear all filters",
  "bounties.sort.newest": "Newest first",
  "bounties.sort.reward": "Highest reward",
  "bounties.sort.deadline": "Closing soon",
  "bounties.stat.open": "Open bounties",
  "bounties.stat.total.rewards": "Total rewards",
  "bounties.stat.avg.reward": "Avg reward",
  "bounties.stat.closing.soon": "closing soon",
  "bounties.stat.skills.needed": "Skills needed",
  "bounties.stat.urgent": "Urgent",
  "bounties.stat.categories": "categories",
  "bounties.deadline.suffix": "left",
  "bounties.days.one": "1 day",
  "bounties.days.many": "days",
  "bounties.submissions.one": "1 submission",
  "bounties.submissions.many": "submissions",
  "bounties.status.open": "Open",
  "bounties.badge.hot": "Hot",
  "bounties.empty.text": "No bounties match your filters.",
  "bounties.posted.day": "1 day ago",
  "bounties.posted.days": "days ago",
  "bounties.ago": "ago",

  // ── Contributors ──────────────────────────────────────────────────────────
  "contributors.stat.members": "Total Members",
  "contributors.stat.contributed": "Total Contributed",
  "contributors.stat.avg": "Avg per Member",
  "contributors.stat.leaders": "Leaders",
  "contributors.search.placeholder": "Search members...",
  "contributors.role.all": "All",
  "contributors.role.founders": "Founders",
  "contributors.role.admins": "Admins",
  "contributors.role.members": "Members",
  "contributors.sort.label": "Sort by:",
  "contributors.sort.contribution": "Contribution",
  "contributors.sort.joined": "Join Date",
  "contributors.sort.name": "Name",
  "contributors.sort.active": "Last Active",
  "contributors.joined": "Joined",
  "contributors.ago": "ago",
  "contributors.contributed": "contributed",
  "contributors.col.votes": "Votes",
  "contributors.col.payments": "Payments",
  "contributors.col.reputation": "Reputation",
  "contributors.empty": "No contributors match your filters.",
};

/**
 * Returns the English string for `key` (active launch language), falling back
 * to Swahili if absent, then the key itself so missing strings stay visible.
 * Swahili is dormant — flip the order to `sw[key] ?? en[key]` to re-enable it.
 */
export function t(key: string): string {
  return en[key] ?? sw[key] ?? key;
}

export { sw, en };
