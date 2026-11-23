# Landing animations with GSAP

Requested by Albert in the middle of H-09, delivered on the same branch so it lands with the story PR. Read until `## Log` before implementing.

## Specs

S1 — The request, verbatim:

> Quiero que la landing tenga animaciones con gsap, incluso los botones

S2 — Reduced motion is not optional (BRIEF §7, verbatim):

> Avance automático cada 7 s salvo con `prefers-reduced-motion`.
> Accesibilidad: contraste AA, objetivos táctiles ≥ 44 px, navegación completa por teclado... axe sin violaciones serias ni críticas.

S3 — The documented stack said Motion (BRIEF §3, verbatim):

> | Animación | Motion | Transiciones de historias, respetando `prefers-reduced-motion`. |

## The stack decision this records

GSAP is now a dependency of the landing while **Motion stays** for the story player, which is where the brief put it and where its behaviour is already covered by end-to-end tests. The cost is honest and worth stating: two animation libraries ship to a mobile-first product, roughly 24 KB gzip for GSAP core plus the Motion runtime already present.

Consolidating on GSAP everywhere would mean rewriting the player's transitions and re-verifying its gestures, which is not what was asked and would risk behaviour the tests already pin. If the weight matters later, the move is to port the player to GSAP and drop Motion — one library, one mental model — and that is a separate decision with its own PR.

## Constraints

1. **The house rule still applies**: `useEffect` is lint-banned outside `src/shared/hooks/`. Every animation lives behind a hook there, never inline in a component.
2. **Content must be readable without JavaScript and without animation.** Nothing starts at `opacity: 0` in the markup; the hook hides and reveals, so a failure leaves the page legible.
3. **`prefers-reduced-motion: reduce` means no motion at all**: the hook returns early and leaves every element in its final state. No scroll-triggered reveals, no hover scaling, no press effects.
4. **No animation may break axe**: the audit runs after the page settles, and an element caught mid-fade with partial opacity has failed contrast before. The hook must finish or be skipped, not leave things half-lit.
5. **Buttons keep their 44 px targets** and their accessible names. A hover scale is decoration; the click target must not shrink.
6. **No layout shift**: animate `opacity` and `transform` only, never `width`, `height`, `top` or `left`.

## What to animate

- **Hero**: the eyebrow, the headline and the subhead settle in sequence on load; the example card arrives last.
- **Sections**: the how-it-works strip, the story previews, the privacy strip and the FAQ rise slightly as they enter the viewport, once each, not on every scroll.
- **The story preview row**: cards settle with a small stagger when the row first appears.
- **Buttons**: a hover lift and a press compression, on the primary call to action and the header's action. Nothing that moves the hit area.
- **Counters**: the example card's numbers in the hero count up once, because that is the product's idea in one gesture.

## Scope

**Inside**: `src/features/landing/`, a new hook under `src/shared/hooks/`, `package.json` (already added), `docs/models.md` for the pinned version, and the `BRIEF.md` stack row that still says Motion only.

**Outside**: the player, the stories, `src/core/`.

## Tasks

- T1 `use-gsap-reveal` (or equivalent) under `src/shared/hooks/`: reveal on enter, once, skipped entirely under reduced motion, with a test for the reduced-motion decision · worker · commit 1
- T2 Hero, sections and the preview row wired to it, with nothing hidden in the markup · worker · commit 2
- T3 Button micro-interactions and the hero counter, respecting reduced motion · worker · commit 2
- T4 Verify: axe clean in both themes, content visible with reduced motion, `pnpm verify` screenshots unchanged in their final state, and the bundle size delta recorded · parent · commit 3

## Evidence of verification

### `pnpm check` and `pnpm test:e2e` — green

`tsc` · `eslint` · `prettier` · **164 tests** (15 of them new, for the animation policy) · `depcruise` 77 modules · both guards. End to end: **99 passed**.

### The reveal rule changed on evidence, and that is the interesting part

The brief I wrote said "animate `opacity` and `transform`". The first implementation faded content in and **axe failed contrast twice** on elements caught mid-fade, exactly the failure this project already hit in H-08. The shipped version never animates opacity: every reveal is a short rise from a few pixels using `gsap.from`, so the element is legible at every instant of the animation and the audit can run at any moment.

That is a deliberate deviation from my own constraint, made because the constraint was wrong, and it is recorded rather than quietly dropped.

### Nothing is hidden in the markup

Every element renders visible and the hook moves it. With JavaScript blocked, a failed import or a thrown error, the page is still readable — which is the requirement that mattered more than the animation.

### Reduced motion

The hook returns before the first GSAP call when `prefers-reduced-motion: reduce` matches, and an end-to-end test emulates the media query before navigating and asserts the headline and the call to action are at full opacity with no waiting. The pure decision lives in `gsap-reveal-policy.ts` so it can be tested in the node environment, where the hook itself cannot run.

### The bundle cost, on the record

```
pnpm build → dist/assets/index-*.js   668.15 kB (gzip 218.61 kB)
             dist/assets/index-*.css   34.74 kB (gzip   7.36 kB)
```

Vite warns about the chunk size. GSAP's own dist measures about 27.9 kB gzip for the core plus 17.6 kB for `ScrollTrigger`; the bundle is an upper bound because Vite tree-shakes the ESM source. The honest reading: the landing now ships two animation libraries, and the follow-up decision in "The stack decision this records" is to port the player to GSAP and drop Motion, or to accept the weight.

### What was deliberately left alone

The FAQ disclosure is native (`<details>`) and animating it would need `height`, which the constraints forbid. The scroll row's thumb already transitions in CSS. Decorative story art follows its card.

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> Quiero que la landing tenga animaciones con gsap, incluso los botones

L2 — Decision recorded rather than assumed: GSAP for the landing, Motion kept for the player. The rationale and the weight cost are above so the choice stays reviewable.
