# AGENTS.md

> Operating manual for AI agents working on **Dorsal**: a static web app that reads the `activities.csv` file from a user's Strava account export entirely in the browser and turns their 2026 season into eight stories plus a shareable race-bib card. The CSV contains the athlete's whole history; **only 2026 is used**, every other year is discarded inside the worker.
> Methodology adapted from Lauren Tan's agent workflow (verification-first, feature maps, hard constraints over soft rules, self-correcting loops, evals for skills), run on top of **ODD + RDD with gentle-ai / gentle-shell** (section 10).
> `BRIEF.md` says **what** to build and in which order. This file says **how** to work. If they conflict, stop and ask Albert.
> Language: code, identifiers, commits, PRs and issues in English. UI copy in Spanish (externalized in `src/shared/i18n/`).

---

## 0. Core principle: verify, don't guess

You are a capable engineer with **zero business context** who joined five seconds ago. Your output is only trusted when it is **verified by actually running the software**, the same way a real user would use it: open the app, upload a fixture export, watch the stories, share the card.

- **Never** state a root cause ("found the smoking gun") without evidence from code you actually read **and** behavior you actually observed.
- **Never** hand verification back to the human. Albert is not your test runner. If you cannot verify something, say so explicitly and explain what is missing.
- **Never** assume the format of `activities.csv`. The only source of truth is `docs/export-format.md` (written in milestone H-01) and the fixtures generated from it.
- Correct code is the minimum bar. Good code is enforced by the constraints in section 5.

---

## 1. The agent loop (mandatory for every task)

Run this loop autonomously. Do not stop and ask the human unless you are blocked by something only a human can provide (a real export file, a product decision, an irreversible action, anything touching `main`).

```
1. UNDERSTAND   → Restate the task. Map it to a BRIEF.md milestone (H-xx) and to a feature
                  using the Feature Map (section 3).
2. REPRODUCE    → For bugs: reproduce it in the running app with `pnpm verify` BEFORE touching code.
                  For features: define the acceptance check (which fixture, which screen,
                  which assertion) in the ODD feature document.
3. INVESTIGATE  → Read the code that is actually involved. Use sub-agents to search in parallel.
                  Form hypotheses, then confirm each one with evidence (logs, traces, tests).
4. IMPLEMENT    → Follow existing conventions. The shortest path must be the correct path (section 5).
                  In src/core/: test first (RED observed, then GREEN, then REFACTOR).
5. VERIFY       → Run the app with the verification skill (section 2). Observe the real behavior.
                  Run static checks: pnpm typecheck, pnpm lint, pnpm test, pnpm arch
                  (or all at once with `pnpm check`), plus `pnpm test:e2e` for UI changes.
6. SELF-CORRECT → If anything fails, go back to step 3 with the new evidence. Repeat.
                  Do not exit the loop until verification and all checks are green.
7. DELIVER      → Commit the work unit, let RDD assess it, run the independent review
                  (section 10.3), split into atomic PRs against `dev` (section 6).
                  Report what you verified and how.
8. LEARN        → If you hit a failure mode that a rule could have prevented, propose a new
                  lint / CI check / skill (section 5.3).
```

### Loop exit criteria (all must be true)

- [ ] The bug no longer reproduces / the feature behaves as specified **in the running app** (`pnpm verify`).
- [ ] Evidence is attached: screenshots from `artifacts/verify/`, console log, network log, test output, or metric before/after.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm arch` pass locally.
- [ ] No new violations of the hard constraints (section 5.1). In particular, the `@privacy` e2e test is green.
- [ ] No performance regression on the affected path (section 4, if applicable).

### Special case: "already fixed?"

When reproducing a bug report, first check it against the latest `dev`. If it does not reproduce on `dev`, report: *"Reproduced on `main` (production), already fixed on `dev`, needs a release to `main` by Albert."* Do not write code.

---

## 2. Verification skill

The agent must be able to operate the application exactly like a user and inspect it like an engineer. The skill lives in `skills/verify-dorsal/` and its runner in `scripts/verify/`. Every run writes to `artifacts/verify/<timestamp>/` (git-ignored).

| Capability | How in this project |
|---|---|
| Launch a dev build | `pnpm dev` (Vite, http://localhost:5173). `pnpm verify` starts it on its own if it is not running. |
| Programmatic UI control | Playwright (Chromium, WebKit) via `pnpm verify --fixture <name> [--viewport mobile|desktop] [--theme light|dark]`: opens `/`, uploads the fixture `activities.csv` in `/subir`, waits for processing and walks every story. |
| Screenshots | `pnpm verify` saves one PNG per screen and story to `artifacts/verify/<ts>/screens/`. Add `--theme both` to capture light and dark. |
| Console / logs | `artifacts/verify/<ts>/console.log` (main thread and worker). Any `console.error` fails the run. |
| CPU / performance traces | `pnpm verify --trace` saves a Playwright trace (`pnpm exec playwright show-trace <file>`). `pnpm verify --perf` records a Chromium performance trace and lists main-thread long tasks over 50 ms. |
| Heap snapshots / memory | `pnpm verify --heap` takes heap snapshots before upload, after processing and after closing the stories (Chrome DevTools Protocol). |
| Network inspection | `artifacts/verify/<ts>/network.json` lists every request. After the file is selected, the only allowed entries are same-origin static assets already cached. |
| API / backend checks | There is no backend. The equivalent contract is the worker API: `pnpm test src/core src/worker` and the Zod schema of `YearSummary`. |
| Test data / seed | `pnpm fixtures` generates synthetic `activities.csv` files in `fixtures/generated/` from `fixtures/generator/`, following `docs/export-format.md`. Every persona spans several years so the 2026 filter is always exercised. |
| Test credentials | No accounts exist. Use the fixture personas: `runner-es`, `cyclist`, `multisport`, `no-gear`, `few-activities`, `ten-years-history`, `no-2026`, `year-boundaries`, `broken-rows`, `shoe-retired`. **Never** use or commit a real person's CSV. |

Rules:
- Verification is done against the **real running app**, not by reading code and assuming.
- When analyzing a trace, cite the concrete function/long task you found, not a vague impression.
- If the verification tooling itself is broken, fixing it has priority over the original task, and you must say so.
- UI changes are verified at 390×844 and 1440×900, in light and dark theme.

---

## 3. Feature Map

The Feature Map lives at `docs/feature-map.md`. It teaches you **where every feature is and how to reach it**, so vague reports ("the streak story looks wrong", a screenshot with "???") can be mapped to code and to a reproduction path.

### Format for each entry

```markdown
## <Feature name>
- What it is (user point of view): <one line>
- Sub-features: <list>
- How to reach it in the UI: <navigation steps, e.g. "/ → Subir mi archivo → choose activities.csv → story 04">
- Keyboard shortcuts: <e.g. ArrowRight next story, ArrowLeft previous, Space pause, Escape close>
- Selectors for programmatic control: <data-testid values>
- Code location: <src/features/... and src/core/... paths>
- Backend/API involved: none (client-only). Worker method(s): <name>
- Known pitfalls: <notes>
```

### Initial entries (created in H-00, filled as milestones land)

| Feature | Code location |
|---|---|
| Landing | `src/features/landing/` |
| Upload and validation | `src/features/upload/` |
| Processing and progress | `src/features/processing/`, `src/worker/` |
| Export reader | `src/core/export-reader/` |
| Metrics | `src/core/metrics/` |
| Stories player | `src/features/wrapped/player/` |
| Stories 01 to 08 | `src/features/wrapped/stories/<id>/` |
| Share card | `src/features/share/` |
| Theme (light/dark) | `src/shared/theme/` |

Selectors: every interactive element and every story root has a `data-testid` (`story-04-root`, `upload-input`, `share-download`...).

### Maintenance

- **Creating it:** explore the codebase and the running app, then build the initial map entry by entry.
- **Maintaining it:** any PR that adds, moves, renames or removes a feature, route, shortcut or selector **must update the Feature Map in the same PR**.
- If you could not find a feature quickly using the map, that is a defect in the map: fix it.

---

## 4. Investigation discipline (anti-hallucination)

- Read the files that are actually affected before proposing a cause. Check your own tool calls: if you did not open the relevant code, you do not know the answer yet.
- Use sub-agents for wide searches (call sites, related features, history) and keep the main agent as coordinator.
- Use `git log` / `git blame` on the affected files: the git history is a primary source of context.
- Separate clearly in your report: **observed facts**, **hypotheses**, **confirmed causes**.
- Data bugs: reproduce them with the smallest fixture that shows the problem, and add that fixture to the generator before fixing.
- Performance work in the browser: target 60 fps, every frame must finish in ~16 ms. Parsing and metrics run **only** in the Web Worker. On the main thread, look for long tasks (>16 ms during story animations, >50 ms anywhere), heavy computation on the render path, and parsing code that leaked out of the worker.

---

## 5. Constraints: hard beats soft

Enforcement layers, from strongest to weakest:

1. **Codebase architecture and conventions** (strongest: agents copy existing patterns)
2. **Static analysis**: TypeScript, ESLint, dependency-cruiser, CI checks
3. Rules files (this file)
4. Skills
5. Automated review: RDD (gentle-ai native review) plus the independent reviewer agent (section 10.3)

Layers 1 and 2 make CI **red**. Layers 3 to 5 are soft: agents can forget them. Never rely only on soft layers for anything important.

### 5.1 Hard constraints (enforced by CI in this project)

| Constraint | Enforced by |
|---|---|
| Each feature is colocated in one directory: `src/features/<feature-name>/`. Pure domain code lives in `src/core/`. | `pnpm arch` (dependency-cruiser) |
| Forbidden imports: `src/core/` must not import React, DOM types, `src/features/`, `src/app/` or `src/worker/`. `src/core/export-reader/` may only be imported from `src/worker/`. A feature imports another feature only through its `index.ts`. | `pnpm arch` (dependency-cruiser) |
| **No network**: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon` and remote `import()` are banned in `src/`. | `pnpm lint` (`no-restricted-globals`, `no-restricted-syntax`) + e2e `@privacy` |
| **No persistence of user data**: `localStorage`, `sessionStorage`, `indexedDB` and `document.cookie` are banned outside `src/shared/theme/storage.ts`, which may only store the theme preference. | `pnpm lint` |
| **Only 2026 leaves the worker**: rows from other years are discarded while parsing and never stored; the `YearSummary` Zod schema holds only 2026 aggregates, no per-activity rows. The year is decided only in `src/core/time/` (local start date, see `BRIEF.md` 5.4). | `pnpm test` (schema test, `ten-years-history` and `year-boundaries` fixtures) |
| Banned patterns: `useEffect` outside `src/shared/hooks/`; `Math.random` and `new Date()` in `src/core/` (use `src/core/time/` and seeded helpers); default exports. | `pnpm lint` |
| No code comments that narrate history, chat instructions or decisions ("Albert said never do this"). Code must be self-explanatory; context goes in the PR description and the ODD feature document. Allowed exceptions: TSDoc on exported `src/core/` functions (units and formula), `eslint-disable-next-line` with a reason, and links to the export format doc. | `pnpm lint` (custom rule) + review |
| Strict typing, no escape hatches: no `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` without a linked issue, or non-null assertions in `src/core/`. | `pnpm typecheck` (`strict`, `noUncheckedIndexedAccess`) + `pnpm lint` |
| No real exports in git: `.csv` and `.zip` files are only allowed under `fixtures/generated/` and must come from the generator. | CI check `pnpm check:no-real-exports` |
| No Strava logo or brand assets in the repo, and no "Strava" in the product name. | CI check `pnpm check:brand` |
| Strict CSP in `netlify.toml` (`connect-src 'self'`, no third-party origins, self-hosted fonts). | e2e test on the deploy preview |

### 5.2 Conventions ("the shortest path is the best path")

- Agents naturally take shortcuts, so the framework is designed so that **the quickest way to solve a problem is the correct way**.
- To create a new **metric**, copy `src/core/metrics/totals.ts` and `totals.test.ts` (canonical after H-03): one pure function, typed input `Activity[]` plus context, typed output, test first.
- To create a new **story**, copy `src/features/wrapped/stories/02-numeros/` (canonical after H-08): component, `data-testid`, `shouldShow(summary)` guard, i18n keys, light and dark variants.
- To support a new **CSV column or locale variant**, extend the column map in `src/core/export-reader/`, document it in `docs/export-format.md` and add a fixture case to the generator. Columns are always read by index (there are two columns named `Distance`).
- ~80% of work on a feature should stay inside its own directory. If you need to touch many unrelated places, stop and reconsider the design.

### 5.3 Turning feedback into rules

Every time a human has to write a review comment saying "don't do this", that is a **smell**. Instead of only fixing the PR:

1. Fix the PR.
2. Propose how to make it impossible next time, in this order of preference:
   - eliminate the problem categorically (architecture/API change),
   - add a lint rule or CI check,
   - add a compiler/type-level constraint,
   - only as a last resort, add a line to this file or a skill.
3. Do **not** turn one-off review feedback into a global rule unless Albert confirms it is durable.

---

## 6. Pull requests

- Split work into **multiple atomic PRs**; each PR describes one small, coherent change. No hard size cap, but a reviewer must be able to understand and revert it in isolation.
- Branch naming: `feature/<milestone-id>-<slug>` (e.g. `feature/h03-longest-streak`) and `fix/<slug>`, always created from `dev`.
- Commit message format: Conventional Commits with a scope (`feat(metrics): add longest streak`, `fix(export-reader): read distance by column index`).
- PR description must contain:
  - **What & why** (link to the GitHub issue and the ODD feature document `odd/tasks/<id>-<slug>.md`)
  - **How it was verified** (commands run, `pnpm verify` screenshots in light and dark, network log for privacy-relevant changes, before/after metrics)
  - **RDD receipt** and the independent reviewer's findings (section 10)
  - **Feature Map updated?** yes / not needed
  - **New constraint proposed?** (if section 5.3 applied)
- Auto-merge policy: **disabled**. Agents open PRs against `dev` automatically; **only Albert merges** into `dev`. Promotion `dev` → `main` is always done **manually by Albert**. Agents never push to, merge into or force-push `main` or `dev`.

---

## 7. Skills and how they are maintained

Skills live in `skills/`. Each skill encodes a lesson learned from an **observed failure mode** of agents (e.g. "stop guessing the CSV columns, read docs/export-format.md", "how to drive the app with pnpm verify", "how to take a performance trace").

Initial skills (H-00): `verify-dorsal` (section 2) and `export-format` (how to read the export safely).

### Eval playbook (run every time a skill is created or modified)

1. **Coordinator agent** writes a rubric of what the skill must achieve.
2. Coordinator spawns **N sub-agents**, each in its own directory with **neutral names** (sub-agents must not realize they are being evaluated, since that changes their behavior).
3. Each sub-agent performs a realistic task using the skill.
4. Coordinator scores every run against the rubric (e.g. 0 to 10).
5. A **judge agent on a different model** cross-checks the scores to remove self-bias.
6. Run across the models configured in gentle-shell for this repo, as listed in `docs/models.md`.
7. **Hill-climb**: loop (modify skill → re-run eval) until the target score is reached (e.g. 10/10 on every rubric item) or progress stalls; then report.

Store evals in `evals/`.

---

## 8. Local first, then cloud and automations

- New verification skills are built and observed **locally** first: watch how the agent drives the app, fix where it gets lost.
- Only after trusting it locally, run it in CI: GitHub Actions runs `pnpm check`, `pnpm test:e2e` (including `@privacy`) and posts the Netlify deploy preview URL on each PR. No cloud agents in v1.
- Automations built on the same verification skills:
  - **Bug triage bot**: not enabled in v1. When enabled, it picks GitHub issues labeled `bug`, maps them to the Feature Map, reproduces them with `pnpm verify` and the closest fixture, checks whether `dev` already fixes it, and opens a PR against `dev` or posts findings.
  - None else in v1.

Scale gradually: do not jump from 1 trusted agent to 100 parallel agents; untrusted parallelism only burns tokens.

---

## 9. Project reference

- Stack: Vite, React 19, TypeScript (strict), Tailwind CSS v4, pnpm, React Router, Web Worker + Comlink, Papa Parse, Zod, Motion, Vitest, Playwright, ESLint, dependency-cruiser, GitHub Actions, Netlify.
- Repo layout: see `BRIEF.md` section 4.1. Key folders: `src/core/` (pure domain), `src/worker/`, `src/features/`, `src/shared/`, `fixtures/`, `scripts/verify/`, `odd/tasks/`, `docs/`.
- Environments: local (`pnpm dev`), Netlify deploy preview per PR, production deployed from `main`.
- Domain glossary: `docs/glossary.md` (export, `activities.csv`, activity, season 2026, story, archetype, gear, bib card, fixture persona).
- Owners / escalation: Albert (GitHub `aam9063`) owns every product decision, merges and releases.
- Things you must never do:
  - push to, merge into or force-push `main` or `dev`;
  - commit a real `activities.csv`, a Strava export or any personal data;
  - use or show data from any year other than 2026;
  - add any network call, analytics, tracking or third-party origin;
  - store user data anywhere in the browser;
  - add Strava logos or brand assets;
  - widen a milestone's scope without recording it in its ODD feature document.

---

## 10. ODD + RDD (gentle-ai / gentle-shell)

Agents work inside **gentle-shell** (gentle-ai's workspace for Pi). Full detail in `BRIEF.md` section 10.

### 10.1 How the agent loop maps to ODD

| Agent loop (section 1) | ODD phase |
|---|---|
| UNDERSTAND | Authorize (Albert authorizes a milestone or a wave) + Explore |
| REPRODUCE / INVESTIGATE | Explore + Resolve uncertainty |
| (scope decision) | Classify: inline for small work, feature document for substantial work |
| (before the first write) | Track: create `odd/tasks/<id>-<slug>.md`, mirrored in Engram |
| IMPLEMENT / VERIFY / SELF-CORRECT | Implement, task by task, test first in `src/core/` |
| DELIVER / LEARN | Close + RDD + independent review |

### 10.2 RDD

- RDD is **enabled** in this project (`gentle-ai review mode status` must report enabled). Do not disable it.
- After each work-unit commit, the native review assesses the frozen candidate. Its evidence is bound to Git, not to what you say.
- A review finding does not widen the scope by itself. Record it in the feature document and ask if it needs new work.
- Changes that touch section 5.1 privacy constraints, the 2026 filter (`src/core/export-reader/`, `src/core/time/`) or the CSP are **high risk**: always use an independent verifier.

### 10.3 Independent review after every implementation

Before opening the PR, a **different agent** from the one that implemented reviews the diff looking for optimizations, refactors and violations of this file. Its findings are written into the feature document and either fixed or explicitly deferred.

### 10.4 Before starting a session

```bash
gentle-ai --version
gentle-ai sync                 # after every gentle-ai update
gentle-ai review mode status   # must be enabled
gentle-shell                   # then /gentle:status and /gentle:doctor
```
