# H-07: Story player

Feature document for milestone H-07 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — The player's behaviour, verbatim (BRIEF §7):

> **Reproductor de historias:** tocar a la derecha avanza y a la izquierda retrocede, mantener pulsado pausa, flechas del teclado, barras de progreso arriba, botón cerrar. Avance automático cada 7 s salvo con `prefers-reduced-motion`.

S2 — Stories without data are omitted and the bars adjust (BRIEF §6, verbatim):

> Si una historia no tiene datos suficientes, se **omite** y el reproductor ajusta las barras de progreso.

S3 — The short season (BRIEF §6, verbatim):

> Umbral global: con menos de 5 actividades en 2026 se muestra una versión corta (portada, números y dorsal).

S4 — Accessibility (BRIEF §7, verbatim):

> objetivos táctiles ≥ 44 px, navegación completa por teclado, `aria-label` en botones de icono... axe sin violaciones serias ni críticas.

S5 — Acceptance criteria (BRIEF §9, H-07, verbatim):

> Gestos, teclado, pausa, barras, omisión de historias y movimiento reducido.

S6 — Animation (BRIEF §3): `Motion` for transitions, respecting `prefers-reduced-motion`.

## Decisions this document fixes

1. **The player knows nothing about any specific story.** It receives an ordered list of story definitions plus the `YearSummary`, and each definition declares its own `isAvailable(summary)`. That is what makes "omit a story and adjust the bars" a property of the player instead of a list of special cases. Adding a story in H-08 to H-10 must not touch the player.
2. **The progress bars are derived, never stored.** The player renders one bar per _available_ story, so an omitted story leaves no gap: six stories means six bars.
3. **Advance is 7000 ms per story and stops at the last one.** With `prefers-reduced-motion: reduce` there is no automatic advance at all, and the transition animation collapses to an instant change; the user drives it with taps and keys.
4. **Input is one small, testable state machine**: `next`, `previous`, `pause`, `resume`, `close`. Touch zones, the keyboard and the progress advance all call the same five transitions, so the three input paths cannot drift apart.
5. **The player is a route-level component, not a route.** It renders on `/resultado` over the season numbers, and closing it returns to those numbers.
6. **Story 01 only, in this milestone.** The span of the player, the bars, the omission rule and the gestures have to be observable to be verified, and a player with zero stories proves nothing. Story 01 needs no metric (BRIEF §6: "Nunca" is omitted), so it is the cheapest real content. The rest of the stories are H-08 to H-10 and plug into the registry without touching the player.

## Scope

**Inside**: `src/features/wrapped/player/`, `src/features/wrapped/stories/01-portada/`, the story registry, `src/features/wrapped/result-screen.tsx` to open and close the player, `src/shared/i18n/`, `e2e/`.

**Outside**: stories 02 to 08, the share card (H-11).

## Tasks

- T1 The player's input state machine as a pure module with unit tests: next, previous, pause, resume, close, bounds at both ends, and skipping an unavailable story · inline · commit 1
- T2 Player component: progress bars derived from the available stories, tap zones, pointer hold to pause, keyboard (ArrowLeft, ArrowRight, Space), close button, `Motion` transition respecting reduced motion · worker · commit 2
- T3 Story registry plus story 01, and opening/closing the player from the result screen · worker · commit 2
- T4 e2e: advance by tap, go back by tap, keyboard both ways, hold pauses and release resumes, close returns to the numbers, an omitted story leaves no gap in the bars, and reduced motion disables the automatic advance · worker · commit 3
- T5 Verify the four viewport/theme combinations and record the evidence · parent · commit 4

## Evidence of verification

### `pnpm check` — green

`tsc` · `eslint` · `prettier` · **118 tests** in 20 files · `depcruise` 65 modules / 123 dependencies · both repo guards. 13 of those tests are new: 10 for the input machine and 3 for the registry, both written before their module existed.

### `pnpm test:e2e` — 42 passed, zero skipped

The worker first ran the player tests on chromium only, skipping WebKit with the justification "proven on mobile and desktop chromium (AGENTS.md §2)". That is a misreading of the spec — §2 asks for both viewports, it does not exempt a browser — and it excluded **Safari, the browser this product targets first**. Removing the skip was the whole fix: all seven player tests pass on WebKit as well, so the skip was hiding coverage, not a limitation.

Covered end to end: right zone advances, left zone goes back, `ArrowRight`/`ArrowLeft` do the same, holding pauses and releasing resumes, `Escape` and the close button both return to the season numbers, the bar count equals the number of available stories computed from the summary, and with `prefers-reduced-motion: reduce` the story does not advance on its own within a wait longer than the interval.

### `pnpm verify --fixture runner-es` — the screen itself

```
4 screenshots · 279 requests · 0 console problems · worst main-thread drift 0.0 ms of a 50 ms budget
```

The player screenshot shows one progress bar (one available story), the close button, and story 01 with the season year and the total kilometres.

### Limitation this milestone cannot remove, and who removes it

With only story 01 available, a UI assertion like "advancing changes the index" cannot distinguish advance from a no-op, so the end-to-end assertions are written against the computed story count and are **clamped**. The advance logic itself is proven by the 10 machine unit tests, including the bounds at both ends and the no-wrap rule; the end-to-end proves the wiring.

**H-08 must therefore be the milestone that strengthens `e2e/player.spec.ts`**: the moment story 02 lands, the advance, go-back and hold-pause assertions become non-vacuous, and the clamped `Math.min` / `Math.max` wrappers must be removed rather than left in place.

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> sigue

L2 — Scope note, recorded rather than assumed: this milestone ships the player and one story so the behaviour is observable. H-08 keeps stories 02 to 04 as planned; nothing in the player changes when they arrive, which is the point of decision 1.
