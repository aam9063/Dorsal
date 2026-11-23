# H-08: Stories 01 to 04

Feature document for milestone H-08 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — The metrics each story shows (BRIEF §6, verbatim):

| #   | Historia            | Métrica                                            | Definición                                                                                                                                                                                       | Se omite si                    |
| --- | ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 01  | Portada             | (ninguna)                                          | El CSV no trae el nombre: el usuario lo escribe (opcional) en la portada. Solo se guarda en memoria.                                                                                             | Nunca (sin nombre, "Tu año")   |
| 02  | Los números         | `totals`                                           | Suma de distancia, tiempo en movimiento, nº de actividades, días activos y desnivel. Equivalencias: vueltas de pista = km / 0,4; Everest = desnivel / 8.849 m. Reparto por deporte según tiempo. | Nunca                          |
| 03  | El perfil de tu año | `monthlyProfile`                                   | Km por mes. Mes máximo = "Puerto HC". Mes mínimo = "valle". Remontada = máximo posterior al valle / valle.                                                                                       | Menos de 3 meses con actividad |
| 04  | Constancia          | `dailyHeatmap`, `longestStreak`, `favoriteWeekday` | Intensidad diaria en 4 niveles por cuartiles de tiempo. Racha = días consecutivos con actividad. Día favorito = día de la semana presente en más semanas.                                        | Nunca                          |

S2 — Acceptance criteria (BRIEF §9, H-08, verbatim):

> Capturas de `pnpm verify` en claro y oscuro con 3 fixtures distintos.

S3 — Visual reference: the frozen artboards `Strava Wrapped 2026-project/W2-Numeros(.dc).html`, `W3-Perfil`, `W4-Constancia` and their `-claro` twins, plus `W1-Portada`.

S4 — Accessibility and design tokens as fixed in `odd/tasks/h04-landing.md` (S2/S3): semantic tokens only, AA contrast, 44 px targets, text alternative for every chart, axe clean.

S5 — The player contract (`odd/tasks/h07-story-player.md`, decision 1): a story is one line in the registry plus one entry in the content map. **The player must not be touched by this milestone.**

## Obligation inherited from H-07

`e2e/player.spec.ts` carries assertions clamped to a single available story, because with only story 01 "advance" could not be told apart from a no-op. **Story 02 is never omitted**, so the moment it exists those clamps must be deleted, not kept. H-07's document records this as H-08's job.

## Decisions this document fixes

1. **Each story reads only its own section of the summary** and never recomputes a metric. If a number needs a new shape, the metric changes in `src/core/metrics/` with its test, not inside a story.
2. **Charts are described in text for assistive technology**: the heatmap, the monthly profile and the sport split each carry a sentence that states what they encode, because a colour grid alone conveys nothing.
3. **The heatmap is a grid of day cells with an accessible summary**, not 365 focusable elements: one label per row of the grid keeps keyboard navigation sane.
4. **Story copy lives in `src/shared/i18n/es.ts`**, including the archetype names, so a wording change never touches a component.
5. **The name and the grammatical gender from the portada stay in memory only** (S1): story 01 offers an optional name field, and nothing about it is persisted.

## Scope

**Inside**: `src/features/wrapped/stories/01-portada/`, `02-numeros/`, `03-perfil/`, `04-constancia/`, `story-content.tsx`, `registry.ts` (one line per new story), `src/shared/i18n/es.ts`, `e2e/player.spec.ts` (clamps), `e2e/stories.spec.ts`, `docs/feature-map.md`.

**Outside**: stories 05 to 08 (H-09, H-10, H-11), the player component, `src/core/`.

## Tasks

- T1 Story 02 "Los números": distance, moving time, activities, active days, elevation, track laps, Everests and the per-sport split, from the artboard · worker · commit 1
- T2 Story 03 "El perfil de tu año": the twelve-month profile as a chart with peak, valley and comeback, omitted under three active months · worker · commit 2
- T3 Story 04 "Constancia": the four-level heatmap, the longest streak and the favourite weekday · worker · commit 2
- T4 Delete the e2e clamps and extend `e2e/player.spec.ts` so advance, back and hold-pause are proven with at least two available stories · worker · commit 3
- T5 Story copy and the optional name on the portada · worker · commit 3
- T6 Verify: `pnpm verify` in light and dark with three different fixtures, axe clean, and record the evidence · parent · commit 4

## Evidence of verification

### `pnpm check` — green

`tsc` · `eslint` · `prettier` · **122 unit tests** · `depcruise` 69 modules / 138 dependencies · both repo guards.

### `pnpm test:e2e` — 54 passed, zero skipped

Three of them are new for this milestone: story 02 shows the totals derived in the test from the fixture, story 03 is skipped without leaving a gap on `few-activities`, and story 04 renders one cell per active day.

### `pnpm verify` — three fixtures, both themes

```
--fixture runner-es      --viewport mobile   --theme both   16 screenshots · 594 requests · 0 console problems · 0.0 ms drift
--fixture cyclist        --viewport desktop  --theme both   16 screenshots · 594 requests · 0 console problems · 0.0 ms drift
--fixture few-activities --viewport mobile   --theme dark    4 screenshots · 296 requests · 0 console problems · 0.0 ms drift
```

The runner now walks the wrapped with the player's own controls and saves one screenshot per story, which is what "capturas de `pnpm verify` en claro y oscuro con 3 fixtures" actually requires. Before that change it could only photograph the season numbers.

### The inherited obligation is discharged

`e2e/player.spec.ts` no longer contains the single-story clamps: the assertions are strict (`data-index` `'0'` → `'1'` → `'0'`), and every player test asserts `available.length > 1`, so advance, back and hold-pause are now proven with at least two stories. The H-07 review's `R3-001` was folded in at the same time: `clampIndex` is exported from the machine, the player reads every render value through it, and unit tests cover an index past the end.

### Two defects this milestone found and fixed after the writer's own run

1. **The portada's name field could not be tapped.** The player's tap zones are painted above the story, so a pointer tap on the input advanced the story instead of focusing the field, and the optional name was keyboard-only on a phone. Fixed by letting the story own no pointer events (`pointer-events-none`) and opting interactive elements back in, with the story content above the zones. A new end-to-end test clicks the field, types a name and asserts the story index did not move; it failed against the previous code.
2. **The monthly profile emitted an invalid SVG path** (`M0,0.0,87.6 …`, one coordinate too many), which threw a console error on every render of story 03. The writer's own verification never saw it because the runner did not open the player. Found the moment the runner started walking the stories; fixed by joining the points once.

### Native review (lineage `review-ae7262b40bb01982`) and its three findings

Approved and burned. The tracker's base advanced to this branch's own earlier commit, so the candidate shrank to the 18 paths of this milestone instead of the accumulated branch.

| Id       | Severity   | Claim                                                                                                                                                                                                           | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `R3-001` | warning    | The story wrapper's `pointer-events-none` makes interactive elements an opt-in: a future story that adds a control without `pointer-events-auto` would silently advance the story instead of receiving the tap. | **Accepted as a documented trap, not fixed.** This is precisely the defect fixed in this PR, and the reviewer is right that the fix moves the failure mode from "broken now" to "forgotten later". It is recorded in `docs/feature-map.md` as a pitfall. The alternative — a click handler on the container that ignores events whose target is inside a control — is a bigger rewrite of the input path and belongs with the next story that has controls, not with a cosmetic edit here. |
| `R3-002` | warning    | The profile maps month indices to fixed coordinates, so sparse or reordered months would render a misleading silhouette without throwing.                                                                       | **Rejected with evidence.** `YearSummary.monthlyProfile.months` is `z.array(monthDistanceSchema).length(12)` and `monthlyProfile` always emits twelve entries in calendar order, so sparse or reordered months cannot reach the story. The reviewer could not see the schema from this diff.                                                                                                                                                                                               |
| `R3-003` | suggestion | `clampIndex` has no guard for a negative count.                                                                                                                                                                 | **Rejected, with reason.** `count` is the length of an array and cannot be negative; `Math.max(0, …)` already yields zero for any non-positive value. A guard would be unreachable code pretending to be defensive.                                                                                                                                                                                                                                                                        |

### Deviations from the artboards, accepted and recorded

| Deviation                                                                                              | Why                                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| The name field is keyboard-and-pointer but the story still auto-advances while it is focused after 7 s | Fixing the timing interaction needs a player change outside this milestone's scope; recorded in the feature map as a known pitfall |
| The weekday card says "presente en N semanas" instead of "49 de 52 domingos"                           | The summary carries no total-weeks figure; adding one is a `src/core/` change, not a story change                                  |
| The "casi 12 días enteros" sublabel of story 02 is omitted                                             | It needs a days-equivalent derivation that belongs to the metric, not the story                                                    |
| The HC badge uses accent-on-ink                                                                        | The artboard's inverted chip measures about 2.8:1, below AA                                                                        |
| `pnpm verify` captures the stories as screenshots but does not assert their text                       | Story text assertions live in `e2e/stories.spec.ts`, where they are derived from the fixture rather than hardcoded                 |

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> sigue

L2 — Chained branch: this work is stacked on `feature/h07-player` (PR #16) because the story registry and the e2e clamps it must fix only exist there. When #16 merges, this PR retargets to `dev` automatically.
