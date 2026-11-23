# H-05: Worker and progress

Feature document for milestone H-05 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — What the worker is (BRIEF §4.2, verbatim):

> 2. El `File` se pasa al worker (no se copia: es un `Blob`). 3. El worker parsea el CSV fila a fila con Papa Parse y comprueba la cabecera (sección 5.2). 4. **Cada fila se normaliza y se filtra al momento**: si no es de 2026 (sección 5.4) se descarta y solo se suma a un contador. Las filas de otros años nunca se guardan en memoria. 5. Con las `Activity[]` de 2026 calcula las métricas. Va emitiendo progreso. 6. Devuelve un `YearSummary` serializable, validado con Zod: **solo agregados de 2026**, sin filas de actividad ni datos de otros años. 7. El hilo principal termina el worker y pinta las historias desde el `YearSummary`.

S2 — Acceptance criteria (BRIEF §9, H-05, verbatim):

> Progreso real por fases, cancelable, UI fluida durante el procesado (sin long tasks > 50 ms en el hilo principal).

S3 — RPC contract (BRIEF §3, verbatim):

> | Worker RPC | Comlink | API tipada entre hilo principal y worker. |

S4 — Boundaries (AGENTS §5.1): `src/core/` may not import React, DOM types, features, app or worker; `src/core/export-reader/` may only be imported from `src/worker/`; a feature imports another feature only through its `index.ts`.

S5 — Privacy (BRIEF §8): no network call may happen during processing; nothing may be persisted.

S6 — A requirement discovered in review, not in the brief (recorded in `odd/tasks/h02-export-reader.md`, finding R3-002):

> `Papa.parse(text, { step })` over a string runs in a single tick, so no progress tick can be emitted until it finishes. H-05 must therefore drive the parse from the `File` in chunks, or the processing screen cannot report real progress.

## Decisions this document fixes

1. **The chunked read lives in the worker, not in `core`.** `File` and `Blob` are DOM types and `src/core/` may not touch them. `src/core/export-reader/` gains a small incremental accumulator — normalize one row, decide the season, update the counters — and the worker drives it from Papa's `chunk` callback over the `File`. The existing `readActivities(text)` stays, because H-02's tests and the fixtures depend on it; it is implemented on top of the same accumulator so the two paths cannot drift.
2. **Progress is reported per phase, and phases are the brief's work:** `reading` (rows seen and rows kept so far), `computing` (metrics), `done`. Progress carries numbers, never percentages invented by the worker.
3. **Cancellation is a flag checked between chunks**, and it ends the run without producing a summary. The worker is terminated by the main thread anyway; the flag exists so a cancelled run stops reading instead of finishing the file first.
4. **The main thread never parses or computes.** It creates the worker, passes the `File` (a `Blob`, so it is transferred by reference), and renders what comes back.
5. **The summary is validated with Zod on the main thread**, not trusted because it came from our own worker. A contract violation is a bug and must surface as a processing error, not as a broken story.

## Scope

**Inside**: `src/worker/`, `src/features/processing/`, the incremental accumulator in `src/core/export-reader/`, and the route wiring in `src/app/`.

**Outside**: the upload screen and its error states (H-06), the story player (H-07), the stories themselves.

## Tasks

- T1 `src/core/export-reader`: incremental accumulator with tests that prove it produces exactly the same result as `readActivities(text)` for every fixture persona · inline · commit 1
- T2 `src/worker/`: Comlink API, chunked read with progress, cancellation, summary validation · worker · commit 2
- T3 `src/features/processing/`: progress screen with real phase data and a cancel control, 44 px targets, `aria-live` for progress · worker · commit 2
- T4 Wire `/subir` to processing to `/resultado` in `src/app/` · worker · commit 3
- T5 Verify: worker path against the fixtures, no long task over 50 ms on the main thread, cancel works, and the summary carries no per-activity data · parent · commit 4

## Evidence of verification

### `pnpm check` and `pnpm test:e2e` — green

```
tsc · eslint · prettier · 99 unit tests · depcruise 56 modules / 95 dependencies · both guards
pnpm test:e2e   21 passed  (smoke + season, on chromium mobile, webkit mobile and chromium desktop)
```

The season end-to-end test derives its expected numbers by running `readActivities` and `buildYearSummary` in node over the same fixture, then asserts that the screen shows those numbers **through the real worker path**. It runs `pnpm fixtures` in `beforeAll` when the file is absent and never skips itself.

### The acceptance criterion nobody had measured

H-05 asks for "UI fluida durante el procesado (sin long tasks > 50 ms en el hilo principal)". That could not be measured because `pnpm verify` refused `--perf`. It is now implemented, and getting there needed two rejected instruments:

1. `PerformanceObserver` with `entryTypes: ['longtask']` — **rejected on evidence**: the entry type is supported, the observer registers without error, a deliberate 220 ms block on the main thread is executed, and no entry is ever reported.
2. `entryTypes: ['long-animation-frame']` — reported inconsistently: it caught the block when registered inside one `evaluate` that also ran the block, and reported nothing when registered through `addInitScript` or after navigation.

The instrument in use measures what a blocked thread actually looks like: a 10 ms interval recording how late each tick arrives. Validated by blocking the thread for 220 ms, which it reported as **213 ms of drift**.

Measured on the whole flow (landing, `/subir`, chunked analysis of the 356-row `runner-es` fixture through the worker, and the result screen):

```
verify: worst main-thread drift 6.2 ms of a 50 ms budget
worstDrift 6.2 | overBudgetScreens 0 | ok true
```

`--fixture <persona>` also exists now: it uploads `fixtures/generated/<persona>.csv` on `/subir`, screenshots the processing state, waits for the season numbers and writes `perf.json` next to the other evidence.

### Privacy, unchanged

The verify run reports one origin and zero external requests; the analysis happens in the worker and nothing is persisted. The summary crosses the boundary validated by `YearSummary`.

## Progress

T1 to T5 done.

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> continúa

L2 — The upload screen is not part of this milestone. Until H-06 exists, the processing screen is reached with a `File` handed over from a development entry point, and the real upload flow lands next. This keeps the worker reviewable on its own.
