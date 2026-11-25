# Redesign: objeto dorsal con espina editorial

Feature document for the full UI redesign of Dorsal. Read until `## Log` before implementing.

## Specs

S1 — Albert's request (L1, verbatim):

> Y no se puede rediseñar toda la UI? quiero los mismos colores pero me gustaria darle otro diseño

S2 — The approved direction (L2): **03 · Objeto dorsal** — the card's own physical language across the app, bone plates on the ink field, punched pins, torn or dashed edges, sticker energy — **plus the editorial spine borrowed from 01**: a rotated mono label on the edge, numbered section headers in the display face with mono metadata on the same baseline, and hairline rules bounding that band. **Without the chip above the hero headline** (L3): the anchor is the approved artboard `design/redesign-2026/03-objeto-dorsal/01-landing.html`.

S3 — Scope (L2): **the whole product** — landing, upload, processing, result, the story player with its eight stories, and the two shareable cards. Leaving any surface in the old language is the failure mode this decision exists to avoid.

S4 — The palette does not change. Every colour comes from `src/shared/tokens/tokens.css`; no new hex value enters the app. `design/system.md` records the synced tokens, and it is the reference next to the artboards.

S5 — The hard constraints keep applying unchanged (`AGENTS.md` §5.1): no network, no persistence of user data, AA contrast, touch targets ≥ 44 px, complete keyboard navigation, `prefers-reduced-motion` respected, no third-party brand assets, Spanish copy from `src/shared/i18n/`, only 2026 aggregates leaving the worker.

S6 — No kickers above headings, and body copy carries `text-wrap: pretty`. This was decided twice already — once in the live landing and once on the artboard — so no new surface may reintroduce the shape.

S7 — The two cards stay deterministic. Their renderers may be redesigned, but two draws from the same inputs must still produce identical bytes, and the PNG stays 1080×1920.

## Decisions this document fixes

1. **The artboards are the reference, not a mood.** Every surface is implemented against `design/redesign-2026/03-objeto-dorsal/` and `design/system.md`; when a screen has no artboard, the closest one plus the system rules govern it.
2. **The editorial spine is a system, not a landing flourish**: the edge label, the numbered header band and the hairline rules appear on every screen that has a title, including the stories, which is why the `02-numeros` artboard exists.
3. **On narrow screens the spine moves into the header band instead of rotating**, as decided on the artboard: a rotated column at 390 px costs 11 % of the reading width on screens that are already dense.
4. **One surface per work unit.** The redesign lands as sequential PRs, each one reviewable and each one leaving the app consistent: landing → upload and processing → result → player and stories → cards → verification. Two languages never ship at once.
5. **Behaviour is not up for redesign.** The eight stories keep their copy, their metrics and their budgets; the cards keep their data. This milestone changes how it looks, not what it says.

## Scope

**Inside**: `src/features/landing/`, `src/features/upload/`, `src/features/processing/`, `src/features/wrapped/`, `src/features/share/`, `src/shared/{tokens,styles,ui}/`, `src/shared/i18n/` where copy changes, `docs/feature-map.md`, and the artboards' own updates.

**Outside**: the metrics, the worker protocol, the schema, and the H-12 security and performance work.

## Tasks

- T1 `src/features/landing/`: the new language on the landing, against `01-landing.html` · worker · C1
- T2 `src/features/upload/` + `src/features/processing/`: the same language on the picker, the errors and the progress screen · worker · C2
- T3 `src/features/wrapped/result-screen.tsx`: the result screen · worker · C3
- T4 `src/features/wrapped/player/` + the eight stories: chrome and stories against `02-numeros.html` · worker · C4
- T5 `src/features/share/`: the two renderers and their DOM replicas, keeping the determinism tests · worker · C5
- T6 verification: `pnpm check`, full e2e, `pnpm verify` in light and dark at 390 and 1440, Lighthouse not regressing, Feature Map and docs · parent · C6

## Evidence of verification

(filled at T6)

## Progress

Not started. Artboards approved (L3).

## Next step

T1.

## Log

L1 — Albert, verbatim: `Y no se puede rediseñar toda la UI? quiero los mismos colores pero me gustaria darle otro diseño`

L2 — Albert's answers to the direction and scope questions, verbatim: the direction is `me gusta objeto dorsal pero con este detalle de programa de carrera` (with a screenshot of 01's rotated spine and numbered header band), and the scope is `Todo el producto` — landing, upload, processing, result, player with the eight stories and both cards.

L3 — Albert approved the combined artboard with the chip removed: `Aprobar sin el chip`, on the reasoning that the headline carries its own weight and the free claim already lives in the subtitle and the CTA.

L4 — Before this milestone the landing and the stories already had a design pass (commit `5900d7c`): kickers removed, widows fixed, per-story reading budgets, a visible back button. That work survives any direction and is not undone here.
