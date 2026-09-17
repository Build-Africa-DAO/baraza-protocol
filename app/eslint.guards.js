/**
 * Design-system guards (PR 0.5 of `frontend-post-login-audit.md`).
 *
 * Each rule applies to every file under `src/` except an explicit legacy list.
 * The lists are the migration backlog: a file leaves a list in the PR that
 * rebuilds it, and nothing new may join. Do not widen them to make lint pass.
 */

/** Files that still use 9/10/11px type on real content. Floor is `text-xs` (12px). */
export const TINY_TYPE_LEGACY = [
  'src/components/AppErrorBoundary.tsx',
  'src/components/BackendStatus.tsx',
  'src/components/ChainSelector.tsx',
  'src/components/PricingSection.tsx',
  'src/components/onboarding/CsvImport.tsx',
  'src/pages/ClaimIdentity.tsx',
  'src/pages/RetroCommunity.tsx',
  'src/pages/RetroResults.tsx',
  'src/pages/RetroVote.tsx',
];

/**
 * Where the Solana wallet adapter may be imported. Operator tools, the wallet
 * plumbing itself, and the member screens that still have to be moved onto
 * `AccountContext` (Phases 2, 5 and 7 remove the last five).
 */
export const WALLET_ADAPTER_ALLOWED = [
  // plumbing
  'src/components/BarazaWalletModalProvider.tsx',
  'src/components/WalletProviders.tsx',
  'src/lib/**',
  // operator shell (the only chrome where a wallet is furniture)
  'src/components/app/OperatorShell.tsx',
  'src/pages/AdminReconciliation.tsx',
  'src/pages/AkiliCouncilFilings.tsx',
  'src/pages/RetroRounds.tsx',
  'src/pages/RetroCommunity.tsx',
  'src/pages/RetroVote.tsx',
  'src/pages/ClaimIdentity.tsx',
];

/**
 * Files still using CSS gradients. Marketing sections (`*Section.tsx`) keep
 * their photo scrims for good; the app files leave this list as their screens
 * are rebuilt (Phases 1, 5, 6 and 7).
 */
export const GRADIENT_LEGACY = [
  // marketing, permanent
  'src/components/ContactSection.tsx',
  'src/components/PricingSection.tsx',
  // app, to remove
];

const TINY_TYPE = 'text-\\[(9|10|11)px\\]';
const BUTTON_ALIASES = '\\bbtn-(warm|primary|ghost)\\b';
const RAW_GRADIENT = 'bg-gradient-to-|var\\(--gradient-';

const restricted = (pattern, message) => [
  { selector: `Literal[value=/${pattern}/]`, message },
  { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
];

const ALIAS_MESSAGE =
  'btn-warm, btn-primary and btn-ghost were removed in PR 0.2. Use the Button component (variant="default" | "outline").';
const TINY_MESSAGE = 'Type floor is text-xs (12px) on app surfaces (§2.3). Use text-xs or larger.';
const GRADIENT_MESSAGE = 'No gradients in the app (§2.1). Use flat bg-primary or bg-foreground.';

/**
 * Build the `no-restricted-syntax` rule for one file, given which guards apply.
 * Alias guard always applies; the other two are switched off for legacy files.
 */
export function guardRules({ tinyType = true, gradients = true } = {}) {
  return {
    'no-restricted-syntax': [
      'error',
      ...restricted(BUTTON_ALIASES, ALIAS_MESSAGE),
      ...(tinyType ? restricted(TINY_TYPE, TINY_MESSAGE) : []),
      ...(gradients ? restricted(RAW_GRADIENT, GRADIENT_MESSAGE) : []),
    ],
  };
}

export const walletImportRules = {
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: '@solana/wallet-adapter-react',
          message: 'Members sign in with a phone or email (AccountContext). The wallet adapter is for the operator shell only (§X4).',
        },
        {
          name: '@solana/wallet-adapter-react-ui',
          message: 'Members sign in with a phone or email (AccountContext). The wallet adapter is for the operator shell only (§X4).',
        },
      ],
    },
  ],
};
