# H-03: Metrics and the YearSummary contract

Feature document for milestone H-03 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — One pure function per metric (BRIEF §6, verbatim):
> Cada métrica es una **función pura** en `src/core/metrics/<nombre>.ts` con su `.test.ts` (TDD). Cada historia vive en `src/features/wrapped/stories/<id>/`. Si una historia no tiene datos suficientes, se **omite** y el reproductor ajusta las barras de progreso.
> Umbral global: con menos de 5 actividades en 2026 se muestra una versión corta (portada, números y dorsal).

S2 — The metric table (BRIEF §6, verbatim):

| # | Historia | Métrica (función) | Definición | Se omite si |
|---|---|---|---|---|
| 01 | Portada | (ninguna) | El CSV no trae el nombre: el usuario lo escribe (opcional) en la portada. Solo se guarda en memoria. | Nunca (sin nombre, "Tu año") |
| 02 | Los números | `totals` | Suma de distancia, tiempo en movimiento, nº de actividades, días activos y desnivel. Equivalencias: vueltas de pista = km / 0,4; Everest = desnivel / 8.849 m. Reparto por deporte según tiempo. | Nunca |
| 03 | El perfil de tu año | `monthlyProfile` | Km por mes. Mes máximo = "Puerto HC". Mes mínimo = "valle". Remontada = máximo posterior al valle / valle. | Menos de 3 meses con actividad |
| 04 | Constancia | `dailyHeatmap`, `longestStreak`, `favoriteWeekday` | Intensidad diaria en 4 niveles por cuartiles de tiempo. Racha = días consecutivos con actividad. Día favorito = día de la semana presente en más semanas. | Nunca |
| 05 | Tu arquetipo | `archetype` | Reglas deterministas (tabla 6.1). Incluye la distribución de horas de inicio en 24 franjas. | Menos de 10 actividades |
| 06 | Tu material | `gearOfTheYear` | Km y horas por material (`Activity Gear`). Ver 6.2. | Menos del 30 % del tiempo con material asignado |
| 07 | El año en latidos | `heartbeats` | Σ (FC media × tiempo en movimiento en min) de las actividades con pulso. Pico = FC máxima del año con su fecha. Equivalencia: días de reposo a 60 ppm. | Menos del 30 % del tiempo con pulso |
| 08 | Tu dorsal | `bibCard` | Número = km totales redondeados. Nombre, arquetipo, 3 datos y mini perfil del año. | Nunca |

S3 — Archetypes, evaluated in order, first match is the primary and the next one is the secondary trait (BRIEF §6.1, verbatim):

| Arquetipo | Regla |
|---|---|
| Madrugador | ≥ 50 % de inicios antes de las 8:00 |
| Búho | ≥ 40 % de inicios después de las 20:00 |
| Guerrero de fin de semana | ≥ 60 % del tiempo en sábado y domingo |
| Metódico | Actividad ≥ 4 días en ≥ 70 % de las semanas con actividad |
| Multideporte | ≥ 3 deportes con ≥ 10 % del tiempo cada uno |
| Fondista | Mediana de duración ≥ 75 min |
| Constante | Fallback |

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

(filled at T7)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session, after merging H-02:
> 6 ya esta merge

L2 — Scope note: the story copy (archetype names, the "Toca jubilarlas" wording, the Everest equivalence text) is not written here. This milestone returns identifiers and numbers; the Spanish strings live in `src/shared/i18n/` and are chosen in H-08, so a copy change never touches a metric.
