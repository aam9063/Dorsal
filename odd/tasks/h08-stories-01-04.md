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

(filled at T6)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> sigue

L2 — Chained branch: this work is stacked on `feature/h07-player` (PR #16) because the story registry and the e2e clamps it must fix only exist there. When #16 merges, this PR retargets to `dev` automatically.
