# H-03: Metrics and the YearSummary contract

Feature document for milestone H-03 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — One pure function per metric (BRIEF §6, verbatim):

> Cada métrica es una **función pura** en `src/core/metrics/<nombre>.ts` con su `.test.ts` (TDD). Cada historia vive en `src/features/wrapped/stories/<id>/`. Si una historia no tiene datos suficientes, se **omite** y el reproductor ajusta las barras de progreso.
> Umbral global: con menos de 5 actividades en 2026 se muestra una versión corta (portada, números y dorsal).

S2 — The metric table (BRIEF §6, verbatim):

| #   | Historia            | Métrica (función)                                  | Definición                                                                                                                                                                                       | Se omite si                                     |
| --- | ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 01  | Portada             | (ninguna)                                          | El CSV no trae el nombre: el usuario lo escribe (opcional) en la portada. Solo se guarda en memoria.                                                                                             | Nunca (sin nombre, "Tu año")                    |
| 02  | Los números         | `totals`                                           | Suma de distancia, tiempo en movimiento, nº de actividades, días activos y desnivel. Equivalencias: vueltas de pista = km / 0,4; Everest = desnivel / 8.849 m. Reparto por deporte según tiempo. | Nunca                                           |
| 03  | El perfil de tu año | `monthlyProfile`                                   | Km por mes. Mes máximo = "Puerto HC". Mes mínimo = "valle". Remontada = máximo posterior al valle / valle.                                                                                       | Menos de 3 meses con actividad                  |
| 04  | Constancia          | `dailyHeatmap`, `longestStreak`, `favoriteWeekday` | Intensidad diaria en 4 niveles por cuartiles de tiempo. Racha = días consecutivos con actividad. Día favorito = día de la semana presente en más semanas.                                        | Nunca                                           |
| 05  | Tu arquetipo        | `archetype`                                        | Reglas deterministas (tabla 6.1). Incluye la distribución de horas de inicio en 24 franjas.                                                                                                      | Menos de 10 actividades                         |
| 06  | Tu material         | `gearOfTheYear`                                    | Km y horas por material (`Activity Gear`). Ver 6.2.                                                                                                                                              | Menos del 30 % del tiempo con material asignado |
| 07  | El año en latidos   | `heartbeats`                                       | Σ (FC media × tiempo en movimiento en min) de las actividades con pulso. Pico = FC máxima del año con su fecha. Equivalencia: días de reposo a 60 ppm.                                           | Menos del 30 % del tiempo con pulso             |
| 08  | Tu dorsal           | `bibCard`                                          | Número = km totales redondeados. Nombre, arquetipo, 3 datos y mini perfil del año.                                                                                                               | Nunca                                           |

S3 — Archetypes, evaluated in order, first match is the primary and the next one is the secondary trait (BRIEF §6.1, verbatim):

| Arquetipo                 | Regla                                                     |
| ------------------------- | --------------------------------------------------------- |
| Madrugador                | ≥ 50 % de inicios antes de las 8:00                       |
| Búho                      | ≥ 40 % de inicios después de las 20:00                    |
| Guerrero de fin de semana | ≥ 60 % del tiempo en sábado y domingo                     |
| Metódico                  | Actividad ≥ 4 días en ≥ 70 % de las semanas con actividad |
| Multideporte              | ≥ 3 deportes con ≥ 10 % del tiempo cada uno               |
| Fondista                  | Mediana de duración ≥ 75 min                              |
| Constante                 | Fallback                                                  |

S4 — Gear of the year (BRIEF §6.2, verbatim):

> 1. Agrupa las actividades de 2026 por `Activity Gear` (sin material, al grupo "sin asignar", que no se muestra).
> 2. Por cada material: km, horas y nº de actividades de 2026.
> 3. Material estrella = el de más horas. Se muestra con su nombre tal cual lo escribió el usuario.
> 4. Aviso para zapatillas con más de 800 km **en 2026**: "Toca jubilarlas". El CSV solo da los km del año que contamos, no la vida total de la zapatilla, así que el texto lo deja claro.
> 5. Si el deporte principal es bici, se muestran bicis en lugar de zapatillas.

S5 — The summary contract only carries 2026 aggregates (AGENTS §5.1, verbatim):

> **Only 2026 leaves the worker**: rows from other years are discarded while parsing and never stored; the `YearSummary` Zod schema holds only 2026 aggregates, no per-activity rows.

S6 — Conventions (AGENTS §5.2, verbatim):

> To create a new **metric**, copy `src/core/metrics/totals.ts` and `totals.test.ts` (canonical after H-03): one pure function, typed input `Activity[]` plus context, typed output, test first.

S7 — Determinism (AGENTS §5.1): `Math.random` and `new Date()` are banned in `src/core/`; dates come from `src/core/time/`. No default exports.

## Decisions this document fixes

1. **Input is `Activity[]` plus an explicit context**, never the raw CSV and never the DOM. Every function is pure: same activities in, same value out.
2. **Weekday is computed arithmetically from `PlainDateTime`**, not through `Date`. `src/core/time/` gains one pure helper for it, because it is the only module allowed to know about calendar arithmetic.
3. **Every story section is nullable.** A section returns `null` when its threshold is not met, and the summary carries an explicit availability map so the player of H-07 never has to re-derive thresholds.
4. **The schema lives in `src/core/model/`** next to `Activity`, is validated with Zod at the worker boundary, and is asserted by a test to contain no per-activity array.
5. **Rounding happens once, at the edge of each metric**, and is documented in TSDoc: kilometres with one decimal for display, rounded integers for counts. Two functions must never round the same value differently.

## Scope

**Inside**: `src/core/metrics/`, `src/core/model/year-summary.ts`, the weekday helper in `src/core/time/`, and their tests.

**Outside**: the worker and progress reporting (H-05), any UI (H-04, H-07 to H-11), texts and copy (`src/shared/i18n/`, H-08).

## Tasks

- T1 `src/core/time`: pure weekday helper plus its tests, including a leap day and the year boundary · inline · commit 1
- T2 `src/core/metrics/totals.ts` + test (canonical example for the rest) · worker · commit 2
- T3 `src/core/metrics/monthly-profile.ts` + `consistency` (heatmap, streak, favourite weekday) + tests · worker · commit 2
- T4 `src/core/metrics/archetype.ts` (seven rules in order, secondary trait, 24 start-hour buckets) + tests · worker · commit 3
- T5 `src/core/metrics/gear-of-the-year.ts` and `heartbeats.ts` + `bib-card.ts` + tests · worker · commit 3
- T6 `src/core/model/year-summary.ts`: Zod schema, availability map, no per-activity arrays, with a test that proves the omission rules · worker · commit 4
- T7 Independent verification of every number against a hand-computed fixture · parent + verifier · commit 5

## Evidence of verification

### Native review receipt (RDD) for the first committed slice

The candidate carried this milestone's document and the calendar arithmetic, plus earlier milestones already reviewed. Closed approved; authority burned.

| Item     | Value                                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lineage  | `review-875b226977c3f34c`                                                                                                                                                              |
| Tier     | high (the merged CI workflow is in the candidate), 10 files, 1093 lines                                                                                                                |
| Lenses   | `review-reliability`, 1 host-relayed model run                                                                                                                                         |
| Findings | Two, both about `src/core/export-reader` rather than this milestone; recorded in `odd/tasks/h02-export-reader.md`, and one of them (synchronous parsing) becomes a requirement on H-05 |

### `pnpm check` — green

```
tsc --noEmit · eslint · prettier --check · vitest 15 files / 97 tests · depcruise 46 modules / 68 deps · both repo guards
```

### Every number recomputed by the parent, by hand

A five-activity season was built with values chosen so each result is obvious by reading the test, and every metric was compared against the parent's own arithmetic, not against the worker's expectations:

| Metric                   | Hand calculation                                                                | Matched |
| ------------------------ | ------------------------------------------------------------------------------- | ------- |
| `totals`                 | 50 000 m, 15 900 s, 5 activities, 5 active days, 650 m                          | yes     |
| `trackLaps` / `everests` | 125 laps, 650 / 8849                                                            | yes     |
| `monthlyProfile`         | peak February, valley March, comeback 12 000 / 3000 = 4                         | yes     |
| `consistency`            | 2-day streak from 5 January; favourite weekday Monday by 7800 s vs 7200 s       | yes     |
| `archetype`              | `null` at 5 activities; `earlyBird` at exactly 0.50; `nightOwl` at exactly 0.40 | yes     |
| `gearOfTheYear`          | star "Zapatillas A", 9600 s, no retirement                                      | yes     |
| `heartbeats`             | 37 750 beats, peak 180 on 10 February                                           | yes     |
| `bibCard`                | number 50                                                                       | yes     |
| `YearSummary`            | rejects an object carrying `activities`                                         | yes     |

### Independent verifier (AGENTS.md §10.2)

A separate agent probed the formulas against BRIEF §6 with its own scripts. Two findings required a decision from the parent, and both were resolved towards the literal text of the brief:

| #   | Finding                                                                                                                                                             | Decision                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `heartbeats` took the peak only from activities that also carried an average heart rate, so an activity with a maximum of 210 but no average never became the peak. | **Fixed.** BRIEF §6 scopes only the beat sum to "las actividades con pulso"; "Pico = FC máxima del año" is unconditional. The peak now considers every activity carrying a maximum.                                                                               |
| 2   | `nightOwl` counted a start at exactly 20:00:00 as "after 20:00", while `earlyBird` correctly excluded exactly 08:00:00.                                             | **Fixed.** "Después de las 20:00" is strict, and it is now compared in seconds, so a start at 20:00:00 does not count and 20:00:01 does. The existing test that asserted the inclusive reading was corrected, because the reading changed, not to make code pass. |

Also recorded, no action: quartiles collapse to a single level when every day has the same moving time (inherent to quartiles over ties, no `NaN`); the favourite-weekday tie-break (more moving time, then lower weekday index) is a decision this document owns, since the brief only says "presente en más semanas".

### Second native review and its dispositions (lineage `review-74c5299dd0e80599`)

Approved and burned, with four non-blocking findings:

| Id                      | Severity   | Claim                                                                                                    | Disposition                                                                                                                                                                                                                                                                                 |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R3-schema-strictness`  | warning    | `monthDistanceSchema` accepts a negative `distanceM` because it uses `z.number()` without a lower bound. | **Fixed.** Every quantity that cannot be negative now carries `.min(0)`, and `share` and `coverage` are bounded to `[0, 1]`. Two new tests prove the schema rejects a negative total and a negative monthly entry; both were run against the previous schema first and failed, then passed. |
| `R3-misnamed-fixtures`  | suggestion | A reader fixture constant is called `AUGUST_ROW` but holds November data.                                | **Fixed**: renamed to `NOVEMBER_ROW`. It was a naming mistake introduced in H-02.                                                                                                                                                                                                           |
| `R3-redundant-optional` | suggestion | The `?? 0` in `bib-card.ts` is redundant because the array is pre-filled with zeros.                     | **Rejected, with proof.** Removing it makes `tsc` fail with `TS2532: Object is possibly 'undefined'`, because `noUncheckedIndexedAccess` widens an indexed read of `number[]` to `number                                                                                                    | undefined`. The fallback is required by the type system, not decorative. |
| `R3-dead-code-weekday`  | suggestion | The `favoriteWeekday` null check is unreachable after the empty-season early return.                     | **Deferred to H-05**, which rewrites this file to report progress and already carries three similar cleanups.                                                                                                                                                                               |

The verifier independently confirmed: the 30 % gates are exact, `>800 km` is strict, `Fondista` at exactly 4500 s matches, `Multideporte` at exactly 0.10 × 3 matches, `Guerrero` at exactly 0.60 matches, no unguarded division anywhere, `YearSummary` is `strictObject` at every level and rejects `NaN`, `Infinity`, a 13th month and a heatmap entry with an extra key.

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session, after merging H-02:

> 6 ya esta merge

L2 — Scope note: the story copy (archetype names, the "Toca jubilarlas" wording, the Everest equivalence text) is not written here. This milestone returns identifiers and numbers; the Spanish strings live in `src/shared/i18n/` and are chosen in H-08, so a copy change never touches a metric.
