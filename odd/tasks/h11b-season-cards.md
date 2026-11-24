# H-11b: the season cards (dorsal redesign + carnet de temporada)

Feature document for milestone H-11b of `BRIEF.md`, which lands **before** H-12. Read until `## Log` before implementing.

## Specs

S1 — Albert's request (L1, verbatim):

> Continúa con H-12. Pero antes, en la card final que sale tu dorsal no me gusta como queda y a parte hay manera de meter mas cosas o sea más datos? por ejemplo si has entrenaado bici con potenciometro y hay registros de ftp o de watios que se pongan, luego como un track con las zonas que se ha recorrido. Y que se muestre por deporte y por ejemplo si hay running que salga este logo <zapatilla naranja>, si es ciclismo el de la bici. Luego que salga otra con el deporte mas practicado y sus estadisticas. semana con más km acumulados (en todos los deportes que hagas), cuantos récords has hecho, semanas consecutivas cumpliendo entrenos… y en lo de la potencia de la bici asi como una evolucion a lo largo del año. Dime si es viable antes de implementar nada

S2 — Product shape (L2, verbatim answers): `Dorsal limpio + segunda card 'carnet de temporada'`. The dorsal stays the legible two-second artifact; a second 1080×1920 PNG carries the panels. Two images, two share actions.

S3 — Records (L2, verbatim): `Mejores marcas 2026 que calculamos nosotros`. The export carries no Strava PRs, so the card never says "récord": it says "mejores marcas" and the set is a closed, deterministic list defined in S8.

S4 — Power (L2, verbatim): `no lo he mirado, pero yo no tengo potenciometro. lo digo para el que la vaya a usar y si tenga`. Power is a **conditional** panel: it appears only when the file carries watts. Albert cannot verify the column values with his own export, so the reader degrades to `null` and the panel disappears (S6).

S5 — Hard constraints that govern this work (`AGENTS.md` §5.1, `BRIEF.md` §5.4): only 2026 aggregates leave the worker, `YearSummary` stays a tree of `strictObject`s with **no per-activity array**, the year is decided only in `src/core/time/`, no network, no persistence, no `Math.random`/`new Date()` in `src/core/`, Spanish copy in `src/shared/i18n/`, no third-party brand assets, and the PNG stays deterministic (H-11 decision 1).

S6 — `docs/export-format.md` is the only truth about the CSV (`AGENTS.md` §0). A column the doc does not state is not readable. `Potencia promedio ponderada` (index 46) **is confirmed present in Albert's real export** (L5); the other power columns (`Vatios promedio` 33, `Vatios máx.` 32, `Recuento de potencia` 47) stay header-verified and values-unconfirmed. Every power read is nullable: an unparseable or absent value is `null`, never `0`, never a guess, and each power field degrades on its own, so a file with only one of them still shows what it can prove.

S7 — No route, no GPS, no time-in-zone: the export has no polyline and no streams. The card never draws a route and never claims a zone the file cannot prove. The old grey silhouette (a monthly distance series drawn as a mountain) is removed because it lies about what it shows.

S8 — The closed definitions this document fixes, so nothing is invented downstream:

- **Sport split**: one entry per sport present in 2026, with `activityCount`, `distanceM`, `movingTimeS`, `elevationGainM`, and `share` = its fraction of `totals.movingTimeS`. Ordered by `movingTimeS` descending.
- **Most practiced sport**: the entry with the highest `movingTimeS` (time, not distance: walking and riding do not compare by km). The card labels it as the sport that took the most time.
- **Weeks**: ISO-8601 weeks (Monday start, week 1 is the week containing the first Thursday), keyed `isoWeek` 1–53 with the Monday as `{month, day}`. Only weeks with at least one activity are stored.
- **Best week**: the week with the highest `distanceM` across all sports; ties go to the earlier `isoWeek`.
- **A fulfilled week**: at least `MIN_SESSIONS_PER_WEEK = 3` activities. The threshold is one exported constant, and the card prints it ("3 o más entrenos") so the rule is visible on the artifact.
- **Consecutive fulfilled weeks**: the longest run of adjacent `isoWeek` buckets in the same calendar year that each satisfy the threshold.
- **Mejores marcas**: exactly three, each with its date as `{month, day}`: longest session by `distanceM`, biggest single-day `elevationGainM`, and the best week from the previous rule.
- **Power**: the primary intensity value is `weightedAvgPowerW`, read from `Potencia promedio ponderada` (index 46), the one column confirmed in a real export; `avgPowerW` (33) and `maxPowerW` (32) are nullable extras, and `sessionsWithPower` counts activities carrying any of them. Per month: the best weighted average, the best max power, that month's `sessionsWithPower` and `coverage` = share of the month's activities with power. The year totals carry the same fields. **FTP is out of v1**: the export has no FTP column, time-in-zone needs streams, and W/kg needs a weight the app never asks for. Recorded here so the next agent does not re-open it.

S9 — Skill/process (`AGENTS.md` §10): `src/core/` is test-first (RED observed, then GREEN), the privacy and 2026 tests stay green, and the changes to `src/core/export-reader/` plus `src/core/model/` are high risk, so they get an independent verifier and the native review.

## Decisions this document fixes

1. **Two cards, one renderer family.** `render-bib-card.ts` is redesigned in place (same exported API, same determinism test); the carnet is a new `render-season-card.ts`. Both share the palette, the font loading and the number formatting from `src/shared/`.
2. **The dorsal loses the fake chart.** Its bottom third is filled with the three best marks as a full-width data block, not with a decorative silhouette. No dead space, no clipped band: the season band is laid out with measured text widths instead of a fixed width.
3. **The carnet is data-dense on purpose.** Panels, in this order: sport split with icons, best week plus consecutive fulfilled weeks, mejores marcas, and power evolution (only when S4 holds).
4. **Sport icons are our own paths**, defined as SVG path data in `src/features/share/sport-icons.ts` and drawn through `Path2D` on the canvas: shoe (run), bike (ride), swimmer (swim), walker (walk), mountain (hike), ring (other). Monochrome, one stroke weight, no third-party artwork. The orange shoe Albert pasted is a reference for the shape, not an asset to trace or copy.
5. **Power is shown with its coverage**, e.g. "potencia en 34 de 60 salidas", so a partial year cannot read as a complete one.
6. **`YearSummary` grows by aggregates only**: `sportBreakdown`, `weeklyLoad`, `seasonBests`, `powerProfile`, and `availability` flags for the two new panels. A schema test proves a per-activity array is still rejected.

## Scope

**Inside**: `docs/export-format.md`, `fixtures/generator/`, `src/core/{export-reader,model,metrics}/`, `src/features/share/`, `src/features/wrapped/stories/08-dorsal/`, `src/shared/i18n/`, `e2e/`, `docs/feature-map.md`.

**Outside**: H-12 hardening (privacy test, CSP, Lighthouse, OG, launch checklist) — it starts after this lands. The player, the other stories and `src/worker/` protocol are untouched except for the new summary fields flowing through unchanged.

## Tasks

- T1 `docs/export-format.md` + `fixtures/generator/`: document the power columns as header-verified/values-unconfirmed, emit watts for one new persona and keep the rest empty · worker · C1
- T2 `src/core/export-reader/` + `src/core/model/`: nullable power reads (locale decimals, thousands separators, garbage → `null`) · worker · C1
- T3 `src/core/metrics/`: `sport-breakdown`, `weekly-load`, `season-bests`, `power-profile`, each test-first · worker · C1
- T4 `src/core/model/year-summary.ts` + `build-year-summary.ts`: the new sections, the `availability` flags, and the no-per-activity-array test · worker · C1
- T5 `src/shared/i18n/es.ts`: copy for every new block, with the threshold printed in the string · worker · C1
- T6 `src/features/share/render-bib-card.ts` + `bib-card-preview.tsx`: the redesign of decision 2, snapshot test still green · worker · C2
- T7 `src/features/share/render-season-card.ts` + `sport-icons.ts`: the carnet and its snapshot test · worker · C3
- T8 Story 08: both previews and both share/download actions, each with its honest label · worker · C3
- T9 `pnpm verify` in light and dark at 390×844 and 1440×900, `pnpm check`, `pnpm test:e2e`, Feature Map, evidence · parent · C4

## Evidence of verification

(filled at T9)

## Progress

Not started. Waiting on T1.

## Next step

T1.

## Log

L1 — Albert, start of this session, verbatim:

> Continúa con H-12. Pero antes, en la card final que sale tu dorsal no me gusta como queda [Image#2] y a parte hay manera de meter mas cosas o sea más datos? por ejemplo si has entrenaado bici con potenciometro y hay registros de ftp o de watios que se pongan, luego como un track con las zonas que se ha recorrido. Y que se muestre por deporte y por ejemplo si hay running que salga este logo C:\Users\alber\AppData\Local\Temp\orca-paste-1795513699105-46711fd4-bdbf-45e0-ac5a-b0550c0a17ed.png , si es ciclismo el de la bici. Luego que salga otra con el deporte mas practicado y sus estadisticas. semana con más km acumulados (en todos los deportes que hagas), cuantos récords has hecho, semanas consecutivas cumpliendo entrenos… y en lo de la potencia de la bici asi como una evolucion a lo largo del año. Dime si es viable antes de implementar nada

L2 — Viability read after the exploration, observed evidence: the export's documented columns have no FTP, no HR zones and no GPS; the parser reads 12 columns by index and discards power; `YearSummary` has no weekly, sport-distance, best-marks or power aggregate; the generator's header includes `Vatios máx.` (32), `Vatios promedio` (33), `Potencia promedio ponderada` (46) and `Recuento de potencia` (47) but never fills them.

L3 — Albert's answers, verbatim: card shape `Dorsal limpio + segunda card 'carnet de temporada'`; records `Mejores marcas 2026 que calculamos nosotros`; power `no lo he mirado, pero yo no tengo potenciometro. lo digo para el que la vaya a usar y si tenga`.

L4 — Albert's instruction to continue came before this document existed; H-12 is explicitly deferred until this lands (L1, first clause).

L5 — Albert, mid-implementation, verbatim:

> tiene este campo el csv sobre potencia: Potencia promedio ponderada

Evidence that the real export carries that power column. It does not contradict S4: Albert has no power meter, so the column exists and is empty for his own activities, while the panel must still work for someone whose rides carry watts. S6 and the power definition in S8 were amended accordingly, and the worker building the format doc was steered before it finished.
