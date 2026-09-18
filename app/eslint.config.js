import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { GRADIENT_LEGACY, TINY_TYPE_LEGACY, WALLET_ADAPTER_ALLOWED, guardRules, walletImportRules } from './eslint.guards.js';

export default tseslint.config(
  // Build config files live outside tsconfig.app.json's `include` (which
  // covers src/ only). Linting them through the typed parser fails the build,
  // so skip them entirely — they're plain JS/TS that needs no rules to enforce.
  { ignores: ['dist', 'coverage', 'functions', 'vite.config.ts', 'vitest.config.ts', 'eslint.guards.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Catch real bugs
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Keep code intentional
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',

      // Downgrade new v7 rule — setState-in-effect is a common React pattern
      // for derived state resets; treat as advisory rather than blocking.
      'react-hooks/set-state-in-effect': 'warn',
    },
  }
,
  // ── Design-system guards (PR 0.5). See eslint.guards.js for the backlog lists.
  // Later blocks override earlier ones for the same file, so the order is:
  // strict everywhere, then relaxed for each legacy list.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/__tests__/**'],
    rules: guardRules(),
  },
  {
    files: TINY_TYPE_LEGACY,
    rules: guardRules({ tinyType: false }),
  },
  {
    files: GRADIENT_LEGACY,
    rules: guardRules({ gradients: false }),
  },
  {
    files: TINY_TYPE_LEGACY.filter((file) => GRADIENT_LEGACY.includes(file)),
    rules: guardRules({ tinyType: false, gradients: false }),
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/__tests__/**', ...WALLET_ADAPTER_ALLOWED],
    rules: walletImportRules,
  },
);
