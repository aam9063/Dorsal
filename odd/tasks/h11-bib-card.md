# H-11: The bib card and sharing

Feature document for milestone H-11 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — Story 08 (BRIEF §6, verbatim):

> | 08 | Tu dorsal | `bibCard` | Número = km totales redondeados. Nombre, arquetipo, 3 datos y mini perfil del año. | Nunca |

S2 — Acceptance criteria (BRIEF §9, H-11, verbatim):

> PNG 1080×1920 idéntico entre ejecuciones (test de snapshot). Web Share con fichero en móvil y descarga en escritorio.

S3 — The rendering decision (BRIEF §3, verbatim):

> | Tarjeta compartible | Canvas 2D propio (1080×1920 PNG) | Determinista; evita los fallos de fuentes de html-to-image. |

S4 — Copy and tokens as fixed since H-04: Spanish strings in `src/shared/i18n/`, semantic tokens, AA contrast, no Strava branding, and the non-affiliation notice stays in the app footer — the card carries no third-party brand.

S5 — The registry contract (`odd/tasks/h07-story-player.md`, decision 1): one registry line plus one content-map entry. The player is not touched.

## Decisions this document fixes

1. **The PNG is drawn twice from the same inputs and compared byte for byte.** "Idéntico entre ejecuciones" is the acceptance criterion, so the test hashes the produced bytes from two separate draws in the same run, and asserts equality. No `Date`, no `Math.random`, no locale-dependent formatting inside the drawing code: numbers come from `src/shared/format.ts`, which is pinned by its own tests.
2. **Fonts are awaited before the first pixel.** A canvas drawn before Anton and JetBrains Mono load produces a card in a fallback face, and the bytes would differ between a cold and a warm run. The draw waits for `document.fonts.ready` and for the three families explicitly.
3. **Everything is positioned explicitly**, never measured from the DOM. The card is a fixed 1080×1920 grid of coordinates, so a layout change in the app cannot move a pixel on the card.
4. **The card takes the name from memory, not from the file**, because the export does not carry it. The name is optional and lives only in memory (H-08's decision 5); without it the card says what the app says elsewhere.
5. **Sharing is a capability, not a promise**: `navigator.share` with files when available, a download otherwise, and the same PNG in both paths. The button's label tells the truth about what will happen, decided at render time.
6. **The card is not the story.** Story 08 shows the card and the actions; the PNG is generated on demand when the user shares or downloads, so opening the story costs nothing.

## Scope

**Inside**: `src/features/share/` (the renderer and the share/download actions), `src/features/wrapped/stories/08-dorsal/`, `registry.ts`, `story-content.tsx`, `src/shared/i18n/es.ts`, `e2e/`, `docs/feature-map.md`.

**Outside**: `src/core/`, the player, the other stories.

## Tasks

- T1 `src/features/share/render-bib-card.ts`: a pure draw function over a `CanvasRenderingContext2D`-like surface, with the geometry as named constants · worker · commit 1
- T2 The snapshot test: two draws, byte equality, plus a test that the pixels are not blank and that the drawn text respects the AA colour pairs · worker · commit 1
- T3 Story 08: the card preview, the share action with its capability-based label, and the download fallback · worker · commit 2
- T4 e2e: story 08 renders, the download produces a file of the expected dimensions, and the share path is exercised where the browser supports it · worker · commit 3
- T5 Verify in light and dark at 390 px and 1440 px and record the evidence · parent · commit 4

## Evidence of verification

(filled at T5)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> todo merge, continúa

L2 — Albert, correcting my language, which I follow from here on: the work continues now, not "tomorrow".
