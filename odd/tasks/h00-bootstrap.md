# H-00: Bootstrap

Feature document for milestone H-00 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — Acceptance criteria (BRIEF §9, H-00, verbatim):

> `pnpm check` en verde, `pnpm verify` abre la app y guarda captura, deploy preview en Netlify, reglas de lint de la sección 8 activas, `docs/feature-map.md` creado.

S2 — Hard constraints that must be enforced by CI from the first commit (AGENTS §5.1, verbatim rows):

> **No network**: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon` and remote `import()` are banned in `src/`.
> **No persistence of user data**: `localStorage`, `sessionStorage`, `indexedDB` and `document.cookie` are banned outside `src/shared/theme/storage.ts`, which may only store the theme preference.
> Banned patterns: `useEffect` outside `src/shared/hooks/`; `Math.random` and `new Date()` in `src/core/` (use `src/core/time/` and seeded helpers); default exports.
> Strict typing, no escape hatches: no `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` without a linked issue, or non-null assertions in `src/core/`.
> Forbidden imports: `src/core/` must not import React, DOM types, `src/features/`, `src/app/` or `src/worker/`. `src/core/export-reader/` may only be imported from `src/worker/`. A feature imports another feature only through its `index.ts`.

S3 — Repository structure (BRIEF §4.1, verbatim tree):

> `src/app/`, `src/core/`, `src/worker/`, `src/features/`, `src/shared/`, `docs/`, `odd/tasks/`, `skills/`, `evals/`, `fixtures/`, `scripts/verify/`, `e2e/`

S4 — Stack (BRIEF §3): Vite, React 19 + TypeScript strict (TSX), Tailwind CSS v4 with own tokens, pnpm, React Router (library mode, 3 routes `/`, `/subir`, `/resultado`), Comlink, Papa Parse, Zod, Motion, Canvas 2D card, Fontsource (Anton, Inter, JetBrains Mono), Vitest, Playwright + `@axe-core/playwright`, ESLint flat + typescript-eslint strict, Prettier, dependency-cruiser, GitHub Actions.

> Versiones: la última estable de cada herramienta en el momento de H-00. El agente fija las versiones exactas en `package.json` y lo anota en el documento de la feature.

S5 — Input file correction (Albert, this session, verbatim):

> Es en vez de subir .zip, es subir csv no hay mas.
> Y rediseña lo que tengas que rediseñar.

S6 — Verification contract (AGENTS §2, verbatim):

> `pnpm verify --fixture <name> [--viewport mobile|desktop] [--theme light|dark]`: opens `/`, uploads the fixture `activities.csv` in `/subir`, waits for processing and walks every story.
> Every run writes to `artifacts/verify/<timestamp>/` (git-ignored).
> UI changes are verified at 390×844 and 1440×900, in light and dark theme.

S7 — UI copy language (BRIEF §2 + AGENTS header): UI in Spanish, externalized in `src/shared/i18n/`. Code, commits, PRs, issues in English.

## Tasks

- T1 Toolchain scaffold with exact pinned versions · S4 · inline · commit 1
- T2 TypeScript strict + ESLint flat + dependency-cruiser with every S2 rule active and proven by fixtures · S2 · inline · commit 1
- T3 App shell: 3 routes, design tokens, theme with the only allowed storage, externalized Spanish i18n including the corrected CSV copy · S3,S5,S7 · inline · commit 2
- T4 Playwright + `scripts/verify` runner writing `artifacts/verify/<ts>/` · S6 · inline · commit 2
- T5 GitHub Actions CI and `netlify.toml` (draft CSP until H-12) · S1,S2 · inline · commit 3
- T6 `docs/feature-map.md`, `docs/glossary.md`, `docs/models.md`, `skills/verify-dorsal/SKILL.md`, `.gitignore` verification · S1,S3 · inline · commit 3
- T7 Close: `pnpm check` green, `pnpm verify` produces screenshots, evidence recorded here · S1 · inline · commit 3

## Out of scope

`src/core/` readers and metrics (H-02/H-03), real landing and upload screens (H-04/H-06), worker (H-05), story player (H-07), stories (H-08/H-09/H-10), share card (H-11), CSP enforcement (H-12), Netlify project creation and deploy preview (needs Albert's Netlify auth), story 06 redesign (H-09).

## Evidence of verification

All commands run on the bootstrapping machine (Windows 11, Node 24.22.1, pnpm 11.4.0) on branch `feature/h00-bootstrap`.

### `pnpm check` — green

```
$ tsc --noEmit                              no output (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
$ eslint .                                  no output
$ prettier --check .                        All matched files use Prettier code style!
$ vitest run                                Test Files 2 passed (2) · Tests 8 passed (8)
$ depcruise src --config ...                no dependency violations found (32 modules, 43 dependencies)
$ node scripts/check-no-real-exports.mjs    no real exports: clean
$ node scripts/check-brand.mjs              brand check: product name and assets are clean
```

### The gates actually fire (RED observed, probes deleted afterwards)

Probe files were created under `src/`, the checks were run, and the probes were removed. Observed output:

```
src/core/__probe.ts   4:19  error  src/core/ must be deterministic ...  no-restricted-syntax   (new Date())
src/core/__probe.ts   4:37  error  src/core/ must be deterministic ...  no-restricted-syntax   (Math.random())
src/shared/__probe.ts 1:10  error  useEffect lives in src/shared/hooks/ ... no-restricted-syntax
src/shared/__probe.ts 4:8   error  Unexpected use of 'fetch' ...        no-restricted-globals
src/shared/__probe.ts 5:3   error  Persisting user data is banned ...   no-restricted-syntax   (localStorage)
src/shared/__probe.ts 9:16  error  Double type assertions hide ...      no-restricted-syntax
src/shared/__probe.ts 10:1  error  Default exports are banned ...       no-restricted-syntax

  error core-no-ui-layers: src/core/__probe.ts -> src/features/landing/index.ts
  error feature-imports-through-index: src/features/upload/__probe.ts -> src/features/landing/landing-screen.tsx
```

`pnpm exec eslint src` on the real tree prints nothing, so the exemptions (`src/shared/theme/storage.ts`, `src/shared/hooks/`) work without opening holes elsewhere. `tests/tooling/eslint-config.test.ts` re-reads the resolved config per path and fails if any of those entries disappears.

### `pnpm verify` — the app runs

```
verify: 12 screenshots in artifacts\verify\2026-11-23T13-06-25
verify: 972 requests, 0 console problems   (options: viewport both, theme both)
```

12 PNGs = `/`, `/subir`, `/resultado` × mobile 390×844 and desktop 1440×900 × light and dark. The network log for that run contains exactly one origin, `http://127.0.0.1:5173`, and zero external entries: the fonts are self-hosted through Fontsource and no artifact loads anything from a third party. Console log is empty. A manual look at `landing-mobile-dark.png` confirms Anton, the mono eyebrow, the orange pill and both footer notices render in dark mode.

### `pnpm test:e2e` — 15 passed

```
15 passed (5.7s)   projects: mobile (chromium), mobile-webkit (webkit), desktop (chromium)
```

Coverage: landing CTA, navigation to `/subir`, the three routes, theme persistence across a reload including the return to `system`, and an axe scan tagged `wcag2a/aa/21a/21aa` on every route with no serious or critical violation.

### Versions pinned

Recorded in `docs/models.md`, including why TypeScript stays on 6.0.3 (every stable `typescript-eslint` peer range excludes 7.x).

## Delivery shape

`git diff dev..HEAD` is about 1.970 authored lines across 6 commits, well past the ~400-line review slice. The boundary is deliberate and recorded here as the milestone requires: H-00 is a single bootstrap unit whose parts cannot be verified independently. A PR with only the tooling cannot run `pnpm verify` (no app), and a PR with only the screens cannot be linted or checked (no gates). Delivery is therefore one PR against `dev`, and its six commits stay readable in this order:

1. `chore(tooling)` — pinned toolchain, strict TypeScript, ESLint hard constraints, dependency-cruiser boundaries, repo data guards.
2. `feat(app)` — three routes, design tokens, theme preference, externalized Spanish copy with the `activities.csv` correction.
3. `test(verify)` — Playwright projects and the `pnpm verify` evidence runner.
4. `ci` — GitHub Actions pipeline and Netlify headers.
5. `docs` — feature map, glossary, tooling notes, verify skill.
6. `chore(format)` — keeps `AGENTS.md` and `BRIEF.md` out of Prettier after it reflowed them.

Every later milestone returns to slices of roughly 400 lines.

## RDD receipt

- `gentle_review assess` on the committed range (`baseRef: dev`, `committedOnly`): `risk: high`, `reviewDue: true` (`high_risk`), with `agentEscalation` item 5 (delivery or environment) applied for the CI pipeline, the dependency pinning and the Netlify security headers. Plan returned: writer self-verification plus an independent verifier, which is the section 10.3 review running alongside.
- `gentle_review_run` on the same range stopped at preflight with `lens_context_budget_exceeded`: 50 paths and 4.610 changed lines (lockfile included) exceed the reviewer lens context budget, so **no review authority was created** and nothing has to be abandoned or repaired. `retry_safe: true`, `replayable: not_replayable`: retrying the same candidate cannot succeed.
- Consequence, as the provider itself instructs: this delivery becomes a **chained sequence of smaller reviewable commits**, each under the budget, reviewed one at a time. The 4.610 lines are also why the ~400-line slice rule exists; the lockfile is generated and should travel in its own slice so it does not consume reviewer budget.
- Status at this point: code is committed and verified locally, native review pending on the re-sliced scope, independent verifier running (findings land in this document before any PR).

## Independent review (AGENTS.md 10.3)

A separate agent reviewed `dev..feature/h00-bootstrap` and ran its own probes. Verdict: not ready for a PR until findings 1 to 5 were fixed. All eleven are now disposed of:

| #   | Finding                                                                                                                                                                                      | Disposition                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Blocker**: `window.fetch` and `new window.XMLHttpRequest()` passed lint; `no-restricted-globals` only covers bare identifiers, so the most natural way to write a network call escaped S2. | Fixed: `no-restricted-properties` now bans `fetch`, `XMLHttpRequest`, `WebSocket` and `EventSource` reached through `window`, `globalThis` and `self`. Proven RED (`window.fetch` → error) and pinned by a config test. |
| 2   | `export-reader-only-from-worker` fired on `src/core/export-reader/`'s own files, so H-02 could not split the reader.                                                                         | Fixed with `pathNot: ['^src/worker/', '^src/core/export-reader/']`. Both directions proven: a sibling import inside the reader passes, a `src/shared` import of the reader still fails.                                 |
| 3   | Netlify SPA fallback was implicit; publishing any 404 page would have broken `/subir` and `/resultado`.                                                                                      | Fixed with an explicit `[[redirects]]` to `/index.html` (200).                                                                                                                                                          |
| 4   | The verify runner attached collectors once per route on the same page, so listeners accumulated and requests were counted up to three times under the wrong screen labels.                   | Fixed: collectors attach once per page against a mutable current screen. Observable: the same run went from 972 requests to 488, now ~41 per screen.                                                                    |
| 5   | No artifacts on the failure path, and a failing `chromium.launch()` leaked the Vite server.                                                                                                  | Fixed: the browser is created inside the guarded block and every artifact is written in `finally`, including `failure` and `lastScreen` in `summary.json`.                                                              |
| 6   | `React.useEffect` passed lint.                                                                                                                                                               | Fixed: the member-expression form is banned alongside the named import.                                                                                                                                                 |
| 7   | Bare Node builtin imports (`from 'fs'`) passed; only `node:*` was banned.                                                                                                                    | Fixed: the pattern group lists the builtins explicitly plus `node:*`.                                                                                                                                                   |
| 8   | The `storage.ts` exemption is file-wide, so the test only proved that rules disappear.                                                                                                       | Fixed: `src/shared/theme/storage.test.ts` asserts that only the key `dorsal.theme` is ever touched, that `system` clears it instead of storing it, and that a throwing storage degrades to `system`.                    |
| 9   | First paint can precede module execution, and the usual inline-script fix is blocked by `script-src 'self'`.                                                                                 | Accepted and recorded: H-12 acceptance item.                                                                                                                                                                            |
| 10  | Uncommitted feature document.                                                                                                                                                                | Committed with the fixes.                                                                                                                                                                                               |
| 11  | `fixtures/` and `evals/` are missing from the S3 tree.                                                                                                                                       | Recorded: git cannot track empty directories; `fixtures/` arrives with H-01 and `evals/` with the first skill eval.                                                                                                     |

Reviewer answers worth keeping: `$1` inside `pathNot` behaves as intended; the CSP draft is deploy-safe for today's build and leaks nothing on privacy; the theme resolution (`system` removes the attribute, the media query decides) is correct; no `.d` escape hatches and no section 9 violations in `src/`.

After the fixes: `pnpm check` green with 17 tests, `pnpm verify` 12 screenshots with 488 requests and no console problems, `pnpm test:e2e` 15 passed.

## Not verified here (and why)

| Item                                          | Status                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Netlify project and deploy preview            | Needs Albert's Netlify account. `netlify.toml` is written; the preview is an acceptance criterion only Albert can close.                      |
| CSP header verified against a deploy preview  | Header written in `netlify.toml`, verification is H-12 by design. `style-src` keeps `'unsafe-inline'` until the animation layer is decided.   |
| `pnpm verify --fixture/--trace/--perf/--heap` | Refused explicitly: `--fixture` needs the upload flow (H-06), the rest are H-12.                                                              |
| `export-reader-only-from-worker` rule         | The rule is configured but `src/core/export-reader/` does not exist yet, so it cannot fire. Proven in H-02.                                   |
| Comment-narration lint rule                   | AGENTS 5.1 asks for a custom rule. Deferred to H-12 rather than shipping a regex with false positives; ESLint and review cover it until then. |
| CI workflow actually running                  | The YAML is written; it first runs when the branch is pushed.                                                                                 |

## Progress

T1 to T7 done. Milestone H-00 is closed except for the Netlify preview, which is Albert's step.

## Next step

H-01: the data gate. Needs two real `activities.csv` exports (an ES account and an EN one) from Albert to write `docs/export-format.md`; the generator in `fixtures/generator/` follows from it and blocks H-02.

## Log

L1 — Albert, first message of the session:

> En el directorio del proyecto tienes el BRIEF y el AGENTS.md para que leas de que va el proyecto y las normas de desarrollo que vas a tener. Luego en esta carpeta 'Strava Wrapped 2026-project' tienes todos los html del diseño para que veas como va a ser la web/app. Obviamente los wrapped se ven principalmente por no decirte todos en dispositivos moviles. El diseño ya lo incirpora pero por si a caso te lo recalco. El repositorio esta vacio, crea main, pushea la rama saca dev desde main y pusheala tambien para que esten en el repo remoto. Main como brach por default. Lo demas lo tienes en los documentos

L2 — Albert, authorizes H-00 and owns the design deltas:

> lo del diseño lo puedes implemetar tu mientras lo haces. Es en vez de subir .zip, es subir csv no hay mas. Y rediseña lo que tengas que rediseñar. Arranca con h-00

Decision from L2: the exported artboards in `Strava Wrapped 2026-project/` stay untouched as a frozen visual reference. From H-04 on, the source of truth for the design is the implementation in `src/features/`, and the three deltas (CSV instead of `.zip`, story 06 "Tu firma" → "Tu material", 2026-only filter surfaced as "412 de 1.204") are applied in code and recorded here and in `docs/feature-map.md`.

L3 — Scope note recorded, not a scope change: `skills/verify-dorsal/SKILL.md` ships in T6 because it documents the H-00 verifier. `skills/export-format/SKILL.md` moves to H-01 because its content depends on `docs/export-format.md`, which H-01 produces.
