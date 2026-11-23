# H-02: CSV reader and the 2026 filter

Feature document for milestone H-02 of `BRIEF.md`. Read until `## Log` before implementing. This is the milestone where a mistake is hardest to detect: a wrong filter silently changes every number in the product.

## Specs

S1 — Model draft (BRIEF §5.3, verbatim):

> ```ts
> type SportKind = 'run' | 'ride' | 'swim' | 'walk' | 'hike' | 'other'
>
> interface Activity {
>   id: string
>   startLocal: PlainDateTime // hora local resuelta en core/time
>   sport: SportKind
>   sportRaw: string
>   distanceM: number | null
>   movingTimeS: number
>   elapsedTimeS: number
>   elevationGainM: number | null
>   avgHeartRate: number | null
>   maxHeartRate: number | null
>   gear: string | null
> }
> ```

S2 — The year filter (BRIEF §5.4, verbatim):

> - Una actividad es de 2026 si su **fecha de inicio en hora local** está entre el 1 ene 2026 00:00 y el 31 dic 2026 23:59:59.
> - Las filas de otros años **no se guardan**: solo se cuentan para mostrar en el procesado "412 actividades de 2026 (de 1.204 en tu historial)".
> - Casos que deben tener test: 31 dic 2025 a las 23:30 (fuera), 1 ene 2026 a las 00:10 (dentro), 31 dic 2026 a las 23:50 (dentro), cambio de hora de marzo y octubre.

S3 — Reading rules (BRIEF §5.2 + `docs/export-format.md`, which is authoritative):

> - Tiene **dos columnas llamadas `Distance`**... Hay que leer por posición, nunca por nombre.
> - Algunos números vienen con separador de miles...

S4 — Boundaries enforced by `pnpm arch` (AGENTS §5.1, verbatim):

> `src/core/` must not import React, DOM types, `src/features/`, `src/app/` or `src/worker/`. `src/core/export-reader/` may only be imported from `src/worker/`.

S5 — Determinism (AGENTS §5.1, verbatim):

> Banned patterns: `useEffect` outside `src/shared/hooks/`; `Math.random` and `new Date()` in `src/core/` (use `src/core/time/` and seeded helpers); default exports.

S6 — The timezone decision stays open (BRIEF §5.4, verbatim):

> Si H-01 confirma que `Activity Date` viene en UTC, se convierte a la zona horaria del navegador.

## Scope

**Inside**: `src/core/model/`, `src/core/time/`, `src/core/export-reader/`, and their tests.

**Outside**: the `YearSummary` Zod schema and the metrics (H-03), the worker wiring and progress (H-05), any UI.

## Decisions this document fixes

1. **`PlainDateTime` is a plain value**, not a `Date`: `{ year, month, day, hour, minute, second }` with 1-based month. `src/core/time/` is the only module allowed to produce it, which is what makes the ESLint ban on `new Date()` in `src/core/` workable.
2. **No timezone conversion exists in H-02.** The reader treats the export's value as local wall-clock time, which is the interpretation recorded in `docs/export-format.md`. If Albert's check shows the export is UTC instead, the conversion is added in exactly one place — `src/core/time/` — and this document is updated. Do not scatter TZ handling through the reader.
3. **Numbers are parsed per column, not by a universal clever parser.** Index 6 is kilometres with a comma decimal separator; index 17 is metres with a dot. Each gets its own documented rule.
4. **`YearSummary` does not exist yet**; the reader returns activities plus a small stats object (`totalRows`, `inSeason`, `discardedOtherYear`, `corruptRows`) so the processing screen of H-05 can say "412 de 1.204".
5. **Rows from other years are never stored.** Filtering happens row by row while parsing; the discarded rows contribute only to counters.

## Tasks

- T1 `src/core/time/`: month map (including the four-letter `sept`), `parseExportDate(text): PlainDateTime | null`, `isInSeason2026(value): boolean`, with the boundary tests of S2 · inline · commit 1
- T2 `src/core/model/`: `SportKind`, `Activity`, the ES sport map · inline · commit 1
- T3 `src/core/export-reader/`: index-based reader over Papa Parse returning activities plus stats, dropping other years while parsing, counting corrupt rows · inline · commit 2
- T4 Tests against every fixture persona, including `ten-years-history` and `year-boundaries` · inline · commit 2
- T5 Record results and hand off to H-03 · inline · commit 3

## Evidence of verification

(filled at T5)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session, authorizing the milestone chain to continue:

> ya esta todo en dev, estoy mergeando a main. Puedes seguir

L2 — The timezone question is still unanswered (asked twice). H-02 proceeds on the documented assumption, isolated to one function so the answer changes one line, not the architecture. Recorded here instead of blocking the milestone.
