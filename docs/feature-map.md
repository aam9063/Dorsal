# Feature Map

Where every feature lives and how to reach it. A vague report ("the streak story looks wrong") maps to code and to a reproduction path here. Any PR that adds, moves, renames or removes a feature, route, shortcut or selector updates this file in the same PR.

Status legend: **live** (built and verified), **stub** (route renders a placeholder), **planned** (not built, milestone named).

Shared conventions, so each entry does not repeat them:

- Every route renders inside `src/app/root-layout.tsx`, which owns the skip link, the theme toggle and the footer notices.
- Every screen root and every interactive element carries a `data-testid`.
- The verification runner is `pnpm verify` (see `skills/verify-dorsal/SKILL.md`); it walks `/`, `/subir` and `/resultado` and writes `artifacts/verify/<timestamp>/`.
- There is no backend. The only API is the worker contract (`src/worker/`), which lands in H-05.

## App shell

- What it is (user point of view): the frame every screen shares — brand, theme control, privacy line and non-affiliation notice.
- Sub-features: skip link, theme toggle (system / light / dark), footer notices, 404 screen.
- How to reach it in the UI: it wraps every route.
- Keyboard shortcuts: none beyond browser defaults.
- Selectors for programmatic control: `theme-toggle`, `theme-option-system`, `theme-option-light`, `theme-option-dark`, `not-found-root`.
- Code location: `src/app/`, `src/shared/ui/theme-toggle.tsx`, `src/shared/theme/`.
- Backend/API involved: none.
- Known pitfalls: the theme is the only persisted value in the product (`src/shared/theme/storage.ts`, key `dorsal.theme`); `system` removes the attribute so the CSS media query decides. Do not add a second storage key.

## Landing

- What it is: the public explanation of what Dorsal does and the entry to the upload flow.
- Sub-features: hero, call to action, `activities.csv` explanation, FAQ, privacy strip.
- How to reach it in the UI: `/`.
- Keyboard shortcuts: none.
- Selectors for programmatic control: `landing-root`, `landing-cta`, `landing-provisional`.
- Code location: `src/features/landing/`.
- Backend/API involved: none.
- Known pitfalls: status **stub** until H-04. The frozen artboards in `Strava Wrapped 2026-project/Main*.dc.html` are the visual reference, but they still talk about uploading a `.zip`; the product takes `activities.csv`.

## Upload and validation

- What it is: the screen where the user picks `activities.csv`; every error state of BRIEF section 7 lives here.
- Sub-features: file picker, three-step how-to (including unzipping on iOS and Android), error states, progress hand-off.
- How to reach it in the UI: `/subir`, or `landing-cta`.
- Keyboard shortcuts: none yet; the file input must stay reachable by keyboard when H-06 lands.
- Selectors for programmatic control: `upload-root`, `upload-provisional` (placeholder until H-06 adds `upload-input`).
- Code location: `src/features/upload/`.
- Backend/API involved: none; the `File` is passed to the worker (H-05).
- Known pitfalls: status **stub** until H-06. The design artboards say `.zip`; the accepted input is `.csv` only, and copying "zip" into a call to action is a regression. `src/shared/i18n/es.test.ts` fails if copy tells the user to upload a zip.

## Result and story player

- What it is: the eight stories plus the shareable bib card.
- Sub-features: story player (gestures, keyboard, progress bars, skip rules), stories 01–08, share card.
- How to reach it in the UI: `/resultado`, reachable from the processing screen once H-05 exists.
- Keyboard shortcuts: planned — ArrowRight/ArrowLeft advance and go back, holding pauses, Escape closes.
- Selectors for programmatic control: `result-root`, `result-provisional`.
- Code location: `src/features/wrapped/`.
- Backend/API involved: none; it consumes the `YearSummary` returned by the worker.
- Known pitfalls: status **stub** until H-07. The design's story 06 is "Tu firma" (route overlay from GPS files we no longer read); it is replaced by "Tu material" in H-09.

## Theme

- What it is: light and dark appearance, following the system unless the user overrides it.
- How to reach it in the UI: `theme-toggle` in the app shell, on every route.
- Selectors for programmatic control: `theme-option-system`, `theme-option-light`, `theme-option-dark`, plus the `data-theme` attribute on `<html>`.
- Code location: `src/shared/theme/`, `src/shared/hooks/use-theme-preference.ts`, `src/shared/tokens/tokens.css`.
- Known pitfalls: `storage.ts` is the only file allowed to touch `localStorage`; ESLint enforces it. Design tokens are the single source for colors — the frozen artboards carry their own inline copy, so re-derive from `tokens.css`, not from the artboards.

## Export reader

- What it is: reads `activities.csv`, keeps only 2026 rows and drops the rest while parsing.
- Code location: `src/core/export-reader/` (planned, H-02).
- Known pitfalls: read columns by index — the CSV has two columns named `Distance`. `docs/export-format.md` is the only source of truth for the format and it does not exist until H-01 closes.

## Metrics

- What it is: one pure function per story metric.
- Code location: `src/core/metrics/` (planned, H-03).
- Known pitfalls: pure and deterministic — `Math.random` and `Date` are banned there by ESLint; dates come from `src/core/time/`.

## Fixture personas

- What it is: synthetic exports used for verification instead of real data.
- Code location: `fixtures/generator/` and `fixtures/generated/` (planned, H-01). No real export is ever committed.
