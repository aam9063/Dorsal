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

Branch `feature/h02-export-reader`, Windows, Node 24.

### `pnpm check` — green

```
tsc --noEmit (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)   no output
eslint .                                                                      no output
prettier --check .                                                            clean
vitest run                                                                    Test Files 7 passed · Tests 51 passed
depcruise src                                                                 36 modules, 47 dependencies, 0 violations
check:no-real-exports / check:brand                                           clean
```

51 tests: 31 from H-00/H-01 plus 20 for `src/core/`. Zero dependency violations confirms `src/core/` imports nothing from `features/`, `app/`, `worker/` or React.

### Behavioural check run by the parent, outside the module's own tests

Every persona read twice (from the generator and from the file on disk), asserting: no returned activity outside 2026, `movingTimeS <= elapsedTimeS`, `stats.inSeason === activities.length`, counters summing to `totalRows`, generator and disk agreeing, empty and header-only input giving zero, and determinism.

```
runner-es            total  356 | 2026  100 | otros  256 | corruptas 0
cyclist              total  548 | 2026  100 | otros  448 | corruptas 0
multisport           total  236 | 2026   90 | otros  146 | corruptas 0
no-gear              total  180 | 2026   30 | otros  150 | corruptas 0
few-activities       total    3 | 2026    3 | otros    0 | corruptas 0
ten-years-history    total  204 | 2026   28 | otros  176 | corruptas 0
no-2026              total  192 | 2026    0 | otros  192 | corruptas 0
year-boundaries      total   13 | 2026    6 | otros    7 | corruptas 0
broken-rows          total   42 | 2026   12 | otros   28 | corruptas 2
```

### Independent verifier (AGENTS.md §10.2, high risk surface)

A separate agent probed the modules adversarially with its own scripts and found no blocker. Findings and dispositions:

| #   | Finding                                                                                                                              | Severity      | Disposition                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `readOptionalMetres` stripped commas, so `1234,6` read as `12346` and `1.234,6` as `1.2346`: a silent, magnitude-corrupting misread. | should-fix    | Fixed. A comma is only accepted as a thousands separator with valid 3-digit grouping.                                                                    |
| 2   | Negative elapsed time and elevation were accepted.                                                                                   | nit           | Fixed: both columns are now unsigned, an export never produces negatives.                                                                                |
| 3   | The first row of a header-less file was eaten.                                                                                       | nit           | Fixed: the first row is only skipped when it looks like a header, detected by a non-numeric id.                                                          |
| 4   | A malformed other-year row counts as corrupt, not discarded.                                                                         | informational | Accepted; it matches the `ReadStats` contract, and the counters always sum to `totalRows`.                                                               |
| 5   | The date parser tolerates padded days and minutes.                                                                                   | informational | Accepted; every accepted variant parses to the same value, and no misread was found.                                                                     |
| 6   | Whether other-year rows are really not retained.                                                                                     | informational | Confirmed: Papa's `step` resets its per-row structures and only in-season activities are pushed; a 50 000-row all-2025 probe discarded every row.        |
| 7   | Is the season filter exact?                                                                                                          | informational | Confirmed: 2025-12-31 23:59:59 discarded, 2026-01-01 00:00:00 and 2026-12-31 23:59:59 kept, 2027-01-01 discarded, `29 feb 2028` parses but is discarded. |
| 8   | Column map against `docs/export-format.md`.                                                                                          | informational | No mismatch.                                                                                                                                             |
| 9   | One test claimed to read the metre column but could not fail if the index were wrong.                                                | nit           | Fixed with a test whose kilometre and metre columns disagree.                                                                                            |

### The three fixes are proven by their tests, not by assertion

The new tests were run against the previous implementation before being accepted:

```
× rejects a comma-decimal metre value instead of reading it as ten times the distance
× rejects a negative time or elevation instead of keeping it
× does not eat the first row of a file without a header
Tests  3 failed | 9 passed (12)
```

Then with the fix in place: `Tests 20 passed (20)`. A test that cannot fail is not evidence.

### A repo-level defect found on the way

`pnpm check` failed at `format:check` on 51 untouched files. Cause: `core.autocrlf=true` writes the working tree as CRLF while the repository stores LF, and Prettier expects LF. CI was unaffected because it checks out LF. Fixed with `.gitattributes` (`* text=auto eol=lf`), which makes every OS see what CI sees. Verified with `git ls-files --eol` before and after, and `git diff HEAD` empty after the normalisation.

### Native review receipt (RDD)

The first attempt to review the accumulated branch was refused at preflight (`lens_context_budget_exceeded`, 63 paths from `main`'s initial commit: no authority created, nothing to repair). Once `main` was promoted and the base advanced to `dev`'s tip, the candidate was only this milestone's eight paths and the review ran to completion.

| Item    | Value                                                               |
| ------- | ------------------------------------------------------------------- |
| Lineage | `review-b4d4c89245b00dfe`                                           |
| Tier    | medium, 8 files, 892 changed lines, correction budget 200           |
| Lenses  | `review-risk`, `review-reliability`, 2 host-relayed model runs      |
| Outcome | **approved**, authority burned (`gentle-ai.review-acknowledged/v1`) |

Two advisory findings, both non-blocking and both deferred to H-05, where this file changes anyway to report progress:

| Id     | Severity   | Claim                                                                                     | Disposition                                                                                                                                                                |
| ------ | ---------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R3-001 | suggestion | `elapsedTimeS === null` is dead code, because `readRequiredSeconds` never returns `null`. | Accepted; it is a real dead branch, removed in H-05 rather than re-triggering a review cycle for a cosmetic edit.                                                          |
| R3-002 | warning    | `FIELD_COUNT` is a magic constant not referenced by any external specification.           | Accepted with a correction: `docs/export-format.md` does state the 104-column contract, so the constant is documented; the reference is added to the code comment in H-05. |

### Second native review, after the merge (lineage `review-875b226977c3f34c`)

A later candidate still carried this milestone's files, so a reliability review ran again and closed approved with two non-blocking findings. Both are about this milestone's code and both matter for H-05:

| Id     | Severity | Claim                                                                                                         | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R3-001 | warning  | The `readRequiredSeconds` null branch is dead code.                                                           | Same finding as the first review; still deferred to H-05, where this function is touched again.                                                                                                                                                                                                                                                                                                                                                                               |
| R3-002 | warning  | Synchronous CSV parsing blocks the event loop, which contradicts the streaming intent of the `step` callback. | **Accepted, with a consequence recorded**: `Papa.parse(text, { step })` over a string runs in a single tick, so memory stays bounded but no progress tick can be emitted until it finishes. Blocking the worker thread is intended; having no progress is not. H-05 must therefore parse a `File` through `chunk` (asynchronous) or feed the parser in slices, so the processing screen can report real progress. This is a requirement on H-05, not a defect of this reader. |

## Progress

T1 to T5 done. H-03 (metrics and the `YearSummary` schema) is unblocked.

## Next step

H-03: one pure function per metric of BRIEF §6 with TDD, plus the `YearSummary` Zod schema that H-05 will return from the worker. The `PlainDateTime` of this milestone already carries everything the archetype and the monthly profile need.

## Timezone: closed

Albert compared an activity in the Strava UI with its row in the export and the times match, so the value is local wall-clock time. `asExportedLocalWallClock` stays the identity, permanently, and no conversion is needed. This is settled by observation, not by assumption.

## Log

L1 — Albert, this session, authorizing the milestone chain to continue:

> ya esta todo en dev, estoy mergeando a main. Puedes seguir

L2 — The timezone question is still unanswered (asked twice). H-02 proceeds on the documented assumption, isolated to one function so the answer changes one line, not the architecture. Recorded here instead of blocking the milestone.
