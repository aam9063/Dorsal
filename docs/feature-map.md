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
- Selectors for programmatic control: `upload-root`, `upload-input`, and one per error state: `upload-error-extension`, `upload-error-size`, `upload-error-zip`, `upload-error-not-strava`, `upload-error-no-2026`, `upload-warning-corrupt`, `upload-error-unsupported`.
- Code location: `src/features/upload/`.
- Backend/API involved: none; the `File` is passed to the worker (H-05).
- Known pitfalls: the extension and the 50 MB size limit are checked on the main thread before the worker is touched; everything that needs bytes (is this a Strava export, is it the zip, how many rows are unreadable) is decided in the worker. A zip is detected by its `PK` signature, so a renamed archive is caught too. A file with rows but **zero 2026 activities is an error state**, never a summary of zeroes: that silent zero already happened once with a real export. The pasted copy must never tell the user to upload the zip; `src/shared/i18n/es.test.ts` fails if it does.

## Processing and progress

- What it is: the screen that runs the analysis while the user watches, and the only place that talks to the worker.
- Sub-features: chunked read of the `File`, real per-phase counters, cancellation.
- How to reach it in the UI: `/subir` → choose `activities.csv` → the upload screen swaps to the processing screen in place.
- Keyboard shortcuts: none; the cancel control is a normal button.
- Selectors for programmatic control: `processing-root`, `processing-progress` (an `aria-live` region), `processing-cancel`.
- Code location: `src/features/processing/`, `src/worker/`, `src/shared/hooks/use-analysis.ts`.
- Backend/API involved: the worker, through Comlink. `analyze(file, reportProgress)` plus a cancel channel.
- Known pitfalls: progress carries **counts**, never invented percentages. The parse is chunked over the `File` on purpose: a synchronous parse of a whole string cannot emit a tick until it ends. The summary is validated with Zod on the main thread, so a contract violation surfaces as a processing error.

## Stories 01 to 04

- What it is: the content of the wrapped — the cover, the season numbers, the monthly profile and the consistency grid.
- Sub-features: optional name on the cover (memory only), the totals and per-sport split, the twelve-month mountain with peak, valley and comeback, the four-level heatmap with the longest streak and the favourite weekday.
- How to reach it in the UI: `/subir` → choose a file → `/resultado` → "Ver mi wrapped".
- Selectors for programmatic control: `player-story-01-portada`, `player-story-02-numeros`, `player-story-03-perfil`, `player-story-04-constancia`, `portada-name-input`.
- Code location: `src/features/wrapped/stories/`.
- Known pitfalls: a story reads its section of the `YearSummary` and never recomputes a metric; story 03 disappears when there are fewer than three active months, and the player's bars shrink with it. The cover's name field needs `pointer-events-auto` because the player hands the pointer to its own zones. The profile's SVG path is built from the real monthly series, so a malformed join is a console error rather than a silent blank.

## Result and story player

- What it is: the eight stories plus the shareable bib card, played as a vertical feed.
- Sub-features: story player (gestures, keyboard, progress bars, skip rules), stories 01–04 (H-08), stories 05–08 (H-09/H-10/H-11), share card.
- How to reach it in the UI: `/resultado` → `result-open-player`.
- Keyboard shortcuts: ArrowRight next story, ArrowLeft previous, Space pause/resume, Escape close; holding the pointer pauses and releasing resumes; automatic advance every 7 s (suppressed under `prefers-reduced-motion`).
- Selectors for programmatic control: `result-root`, `result-open-player`, `result-totals`, `player-root` (`data-index`, `data-paused`), `player-progress-bar-<story-id>`, `player-story-<story-id>`, `player-zone-next`, `player-zone-previous`, `player-close`.
- Code location: `src/features/wrapped/` (player in `player/`, registry in `stories/registry.ts`, content map in `stories/story-content.tsx`); each story in `stories/<id>/`.
- Backend/API involved: none; it consumes the `YearSummary` returned by the worker.
- Known pitfalls: the available story count is fixture-dependent (story 03 needs three active months), so `player-root[data-index]` can be below the registry length; the render clamps an out-of-range index to the last story. The design's story 06 is "Tu firma" (GPS overlay we no longer read); it becomes "Tu material" in H-09. The portada name input is reachable by keyboard but not by pointer: the player tap zones overlay the story, so a pointer tap advances instead of focusing (needs a player change to fix).

## Story 01 · La portada

- What it is: the season year and an optional name the user types in.
- Sub-features: name field (in memory only, never persisted).
- How to reach it in the UI: open the player; it is story 1.
- Keyboard shortcuts: player-wide ones; typing in the name field consumes Space and ArrowLeft/ArrowRight (the story does not change while typing).
- Selectors for programmatic control: `portada-name-input`, story root `story-01-portada`.
- Code location: `src/features/wrapped/stories/01-portada/`.
- Backend/API involved: none. Worker method(s): none — reads `summary.totals.activityCount`.
- Known pitfalls: the name lives in `01-portada/season-name.ts` module memory; nothing may persist it. Story 06/08 will read it for the bib card.

## Story 02 · Los números

- What it is: distance, moving time, activities, active days, elevation, track-lap and Everest equivalences and the per-sport time split.
- How to reach it in the UI: player story 2 (never omitted).
- Selectors for programmatic control: `numeros-distance`, `numeros-laps`, `numeros-moving-time`, `numeros-activities`, `numeros-active-days`, `numeros-elevation`, `numeros-everests`, `numeros-sport-split`; story root `story-02-numeros`.
- Code location: `src/features/wrapped/stories/02-numeros/`.
- Backend/API involved: none. Worker method(s): none — reads `summary.totals`.
- Known pitfalls: every number comes straight from `totals` — the story never recomputes (H-08 decision 1). The sport split is a `role="img"` list whose `aria-label` states the encoding.

## Story 03 · El perfil de tu año

- What it is: the twelve-month distance profile as a mountain silhouette with the peak ("Puerto HC"), the valley and the comeback ratio.
- How to reach it in the UI: player story 3; omitted below three active months (the player shrinks the bars, no gap).
- Selectors for programmatic control: `perfil-peak`, `perfil-valley`, `perfil-comeback` (absent when there is no comeback), `perfil-valley-marker`; story root `story-03-perfil`.
- Code location: `src/features/wrapped/stories/03-perfil/`.
- Backend/API involved: none. Worker method(s): none — reads `summary.monthlyProfile`.
- Known pitfalls: the SVG geometry is computed from the monthly distances (no fixed path). The chart carries an `aria-label` enumerating km per month; peak and valley are also named in visible text.

## Story 04 · Constancia

- What it is: the daily heatmap in four levels, the longest streak with its date range and the favourite weekday.
- How to reach it in the UI: player story 4 (never omitted).
- Selectors for programmatic control: `constancia-heatmap` (`role="img"` summary), `constancia-cell-<month>-<day>`, `constancia-legend`, `constancia-active-days`, `constancia-favorite-weekday-weeks`; story root `story-04-constancia`.
- Code location: `src/features/wrapped/stories/04-constancia/`.
- Backend/API involved: none. Worker method(s): none — reads `summary.consistency`.
- Known pitfalls: cells are presentational (`aria-hidden`), so there are never 365 focusable elements (H-08 decision 3); the legend carries the level names so colour never encodes alone. The heatmap only renders days with activity, one cell each.

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
