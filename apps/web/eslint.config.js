import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

// NOTE: @typescript-eslint plugin is intentionally excluded here.
// TypeScript 7.x ships a renamed internal API (Intrinsic → IntrinsicType) that
// ts-api-utils@1.x (a transitive dep of @typescript-eslint/type-utils) has not
// yet tracked. Loading the plugin causes a crash at module load time regardless
// of whether typed rules are enabled. This is a documented upstream gap.
//
// The parser alone works fine and gives us: syntax validation, React Hooks
// rule-of-hooks checks. TypeScript type-checking quality gates are covered by
// `tsc --noEmit` (which uses the TS7 compiler directly and passes cleanly).
// When ts-api-utils ships TS7 support, re-add @typescript-eslint plugin here.

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
