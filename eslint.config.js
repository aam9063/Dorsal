import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

const MESSAGE = {
  network:
    'No network access in src/: once the file is chosen the app makes zero requests (AGENTS.md 5.1).',
  storage:
    'Persisting user data is banned. Only src/shared/theme/storage.ts may store the theme preference (AGENTS.md 5.1).',
  useEffect:
    'useEffect lives in src/shared/hooks/ so effects stay reusable and testable (AGENTS.md 5.1).',
  coreDeterminism:
    'src/core/ must be deterministic: dates come from src/core/time/ and randomness from a seeded helper (AGENTS.md 5.1).',
  defaultExport: 'Default exports are banned; use named exports (AGENTS.md 5.1).',
  nodeBuiltin:
    'src/ runs in the browser; Node builtins belong to scripts/ and e2e/ (AGENTS.md 5.1).',
  doubleAssertion:
    'Double type assertions hide an unproven conversion; model the type instead (AGENTS.md 5.1).',
}

const NETWORK_SYNTAX = [
  { selector: "NewExpression[callee.name='XMLHttpRequest']", message: MESSAGE.network },
  { selector: "NewExpression[callee.name='WebSocket']", message: MESSAGE.network },
  { selector: "NewExpression[callee.name='EventSource']", message: MESSAGE.network },
  { selector: 'ImportExpression[source.value=/^(https?:)?\\/\\//]', message: MESSAGE.network },
  { selector: 'ImportDeclaration[source.value=/^(https?:)?\\/\\//]', message: MESSAGE.network },
]

const STORAGE_SYNTAX = [
  {
    selector: "MemberExpression[object.name='document'][property.name='cookie']",
    message: MESSAGE.storage,
  },
  {
    selector: "MemberExpression[object.name='window'][property.name='localStorage']",
    message: MESSAGE.storage,
  },
  {
    selector: "MemberExpression[object.name='window'][property.name='sessionStorage']",
    message: MESSAGE.storage,
  },
  {
    selector: "MemberExpression[object.name='window'][property.name='indexedDB']",
    message: MESSAGE.storage,
  },
  {
    selector: "MemberExpression[object.name='globalThis'][property.name='localStorage']",
    message: MESSAGE.storage,
  },
  {
    selector: "MemberExpression[object.name='globalThis'][property.name='sessionStorage']",
    message: MESSAGE.storage,
  },
  {
    selector: "MemberExpression[object.name='globalThis'][property.name='indexedDB']",
    message: MESSAGE.storage,
  },
]

const HOOKS_SYNTAX = [
  { selector: "ImportSpecifier[imported.name='useEffect']", message: MESSAGE.useEffect },
  {
    selector: "MemberExpression[object.name='React'][property.name='useEffect']",
    message: MESSAGE.useEffect,
  },
  {
    selector: "MemberExpression[object.name='React'][property.name='useLayoutEffect']",
    message: MESSAGE.useEffect,
  },
]

const CORE_SYNTAX = [
  { selector: "NewExpression[callee.name='Date']", message: MESSAGE.coreDeterminism },
  { selector: "CallExpression[callee.name='Date']", message: MESSAGE.coreDeterminism },
  {
    selector: "MemberExpression[object.name='Date'][property.name='now']",
    message: MESSAGE.coreDeterminism,
  },
  {
    selector: "MemberExpression[object.name='Math'][property.name='random']",
    message: MESSAGE.coreDeterminism,
  },
]

const DEFAULT_EXPORT_SYNTAX = [
  { selector: 'ExportDefaultDeclaration', message: MESSAGE.defaultExport },
]

const DOUBLE_ASSERTION_SYNTAX = [
  {
    selector: "TSAsExpression[expression.type='TSAsExpression']",
    message: MESSAGE.doubleAssertion,
  },
]

const RESTRICTED_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource']

const STORAGE_GLOBALS = ['localStorage', 'sessionStorage', 'indexedDB']

const NETWORK_PROPERTIES = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].flatMap(
  (property) =>
    ['window', 'globalThis', 'self'].map((object) => ({
      object,
      property,
      message: MESSAGE.network,
    })),
)

const NODE_BUILTINS = [
  'buffer',
  'child_process',
  'crypto',
  'fs',
  'fs/promises',
  'http',
  'https',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'stream',
  'url',
  'util',
  'worker_threads',
  'zlib',
]

function restrictedSyntax(...groups) {
  return ['error', ...groups.flat()]
}

const typeAwareFiles = [
  'src/**/*.{ts,tsx}',
  'tests/**/*.ts',
  'scripts/**/*.ts',
  'e2e/**/*.ts',
  'fixtures/**/*.ts',
]

function appRules({ allowStorage, allowUseEffect }) {
  const syntax = [...NETWORK_SYNTAX, ...DEFAULT_EXPORT_SYNTAX, ...DOUBLE_ASSERTION_SYNTAX]
  if (!allowStorage) syntax.push(...STORAGE_SYNTAX)
  if (!allowUseEffect) syntax.push(...HOOKS_SYNTAX)

  return {
    'no-restricted-globals': [
      'error',
      ...RESTRICTED_GLOBALS.map((name) => ({ name, message: MESSAGE.network })),
      ...(allowStorage ? [] : STORAGE_GLOBALS.map((name) => ({ name, message: MESSAGE.storage }))),
    ],
    'no-restricted-properties': [
      'error',
      ...NETWORK_PROPERTIES,
      { object: 'navigator', property: 'sendBeacon', message: MESSAGE.network },
      ...(allowStorage
        ? []
        : [
            { object: 'document', property: 'cookie', message: MESSAGE.storage },
            { object: 'window', property: 'localStorage', message: MESSAGE.storage },
            { object: 'window', property: 'sessionStorage', message: MESSAGE.storage },
            { object: 'window', property: 'indexedDB', message: MESSAGE.storage },
          ]),
    ],
    'no-restricted-syntax': restrictedSyntax(syntax),
    'no-restricted-imports': [
      'error',
      { patterns: [{ group: ['node:*', ...NODE_BUILTINS], message: MESSAGE.nodeBuiltin }] },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
      },
    ],
  }
}

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'artifacts/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'fixtures/generated/**',
      'Strava Wrapped 2026-project/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: typeAwareFiles,
  })),
  {
    files: typeAwareFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: appRules({ allowStorage: false, allowUseEffect: false }),
  },
  {
    files: ['src/shared/theme/storage.ts'],
    rules: appRules({ allowStorage: true, allowUseEffect: false }),
  },
  {
    files: ['src/shared/hooks/**/*.{ts,tsx}'],
    rules: appRules({ allowStorage: false, allowUseEffect: true }),
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      ...appRules({ allowStorage: false, allowUseEffect: false }),
      'no-restricted-syntax': restrictedSyntax(
        NETWORK_SYNTAX,
        DEFAULT_EXPORT_SYNTAX,
        DOUBLE_ASSERTION_SYNTAX,
        STORAGE_SYNTAX,
        HOOKS_SYNTAX,
        CORE_SYNTAX,
      ),
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.ts',
      'e2e/**/*.ts',
      'scripts/**/*.ts',
      'fixtures/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  prettier,
]
