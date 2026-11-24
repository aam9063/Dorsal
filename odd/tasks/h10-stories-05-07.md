# H-10: Stories 05 and 07

Feature document for milestone H-10 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — Story 05, the archetype (BRIEF §6, verbatim):

> | 05 | Tu arquetipo | `archetype` | Reglas deterministas (tabla 6.1). Incluye la distribución de horas de inicio en 24 franjas. | Menos de 10 actividades |

S2 — Story 07, the year in heartbeats (BRIEF §6, verbatim):

> | 07 | El año en latidos | `heartbeats` | Σ (FC media × tiempo en movimiento en min) de las actividades con pulso. Pico = FC máxima del año con su fecha. Equivalencia: días de reposo a 60 ppm. | Menos del 30 % del tiempo con pulso |

S3 — Acceptance criteria (BRIEF §9, H-10, verbatim):

> Las reglas de arquetipo cubiertas con un fixture por arquetipo.

S4 — The player contract (`odd/tasks/h07-story-player.md`, decision 1): one registry line plus one content-map entry. **The player is not touched.**

S5 — Accessibility and tokens as fixed in H-04 and applied since: semantic tokens only, AA contrast, no colour-only information, a text alternative for every chart, axe clean.

S6 — Visual reference: `Strava Wrapped 2026-project/W5-Arquetipo(.dc).html` and `W7-Latidos(.dc).html` plus their `-claro` twins.

## What the metrics already provide

- `archetype`: `{ primary, secondary, startHours: number[24] } | null`, with the seven rule ids in evaluation order.
- `heartbeats`: `{ beats, restingDays, peak: { bpm, month, day } | null, coverage } | null`.

A story never recomputes either; it renders what the metric decided.

## Decisions this document fixes

1. **The archetype story names the result, not the rule.** The headline is the archetype's own name (from `es.ts`), because that is the story's point; the secondary trait appears as a supporting line, and the seven rules are never listed to the user.
2. **The 24-hour distribution is a radial chart** like the artboard's clock, built from `startHours`, with the peak hour labelled in text. The chart is decorative and the sentence beside it carries the information.
3. **The heartbeats story leads with the total**, then the resting-days equivalence, the peak heart rate with its date, and the coverage in words. A number nobody can feel needs its equivalence next to it.
4. **The peak may be missing while the story exists**: an activity can carry a maximum heart rate without an average, and the section is still shown because the coverage gate already passed. The peak block is simply omitted.
5. **Both stories are omitted by `availability`**, never by re-deriving a threshold.
6. **Copy lives in `src/shared/i18n/es.ts`**, including the seven archetype names and each rule's short description if one is shown at all.

## Scope

**Inside**: `src/features/wrapped/stories/05-arquetipo/`, `src/features/wrapped/stories/07-latidos/`, `registry.ts`, `story-content.tsx`, `src/shared/i18n/es.ts`, `e2e/stories.spec.ts`, `fixtures/generator/` if a persona is needed for the archetype acceptance criterion, `docs/feature-map.md`.

**Outside**: `src/core/`, the player, the other stories.

## Tasks

- T1 Fixtures for the archetype acceptance criterion (S3): personas that make specific archetypes win, so each rule is covered by data and not only by unit tests · worker · commit 1
- T2 Story 05: name, secondary trait, radial start-hour distribution with its text sentence, omitted under ten activities · worker · commit 2
- T3 Story 07: total beats, resting-days equivalence, peak with its date, coverage sentence, omitted under the 30 % gate · worker · commit 2
- T4 e2e: both stories appear with the right persona, the archetype omitted with `few-activities`, the heartbeats omitted with a persona without pulse, and axe over both · worker · commit 3
- T5 Verify in light and dark at 390 px and 1440 px with the archetype personas and the heartbeats persona, and record the evidence · parent · commit 4

## Evidence of verification

(filled at T5)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> todo merge, continúa

L2 — Story order note: 05 and 07 ship together because both metrics already exist and each is one screen; splitting them would need two branches for two files in the same registry.
