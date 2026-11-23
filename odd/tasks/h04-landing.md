# H-04: Landing

Feature document for milestone H-04 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — Acceptance criteria (BRIEF §9, H-04, verbatim):

> Fiel al canvas en claro y oscuro, 390 px y 1440 px, axe sin errores.

S2 — Design tokens (BRIEF §7, verbatim):

> Fuente de verdad visual: el canvas enlazado arriba. Tokens: tinta `#0F100D`, hueso `#F2F0E9`, blanco `#FFFFFF`, naranja `#FC5200`, naranja texto `#C23F00`. Tipografías: Anton (display), Inter (texto), JetBrains Mono (etiquetas y datos).

S3 — Accessibility (BRIEF §7, verbatim):

> Accesibilidad: contraste AA, objetivos táctiles ≥ 44 px, navegación completa por teclado, `aria-label` en botones de icono y texto alternativo en cada gráfico. axe sin violaciones serias ni críticas.

S4 — Copy and brand (BRIEF §2, verbatim):

> No usamos el nombre ni el logo de Strava como marca. Solo frases descriptivas ("compatible con la exportación de tu cuenta de Strava") y un aviso de no afiliación en el footer.
> Idioma | Español en v1, con los textos externalizados para añadir inglés en v1.1.

S5 — The input is the CSV, never the zip (Albert, this session, verbatim):

> Es en vez de subir .zip, es subir csv no hay mas.

S6 — Verification (AGENTS §2, verbatim):

> UI changes are verified at 390×844 and 1440×900, in light and dark theme.

## The visual source

`Strava Wrapped 2026-project/Main.dc.html` (dark) and `Main-claro.dc.html` (light) are frozen exported artboards. They are the reference, not code to copy: their styles are inline and their copy still mentions the `.zip`. Read them for structure, spacing, sizes and colour usage; implement with the project tokens in `src/shared/tokens/tokens.css`.

Section order of the artboard, top to bottom: header with the brand chip, hero in two columns with a mocked bib card, a light "how it works" strip with three numbered steps, a horizontally scrolling row of eight story preview cards, a full-bleed privacy strip, a two-column FAQ, and the footer.

## Deltas this document fixes

1. **The copy says `activities.csv`, never `.zip`.** Every string in the artboard that tells the user to upload a zip changes. The only legitimate mention of a zip is the instruction to unzip the download and take the CSV out of it.
2. **The hero mockup is labelled as an example.** The artboard shows a fictional bib card with invented numbers. It stays (it is the best explanation of the product) but it is `aria-hidden` as decoration and carries a visible "Ejemplo" caption, so nobody mistakes it for their own data.
3. **White text on `#FC5200` is not allowed for normal-size text.** It measures about 3.3:1 and fails AA. Either the text on an orange surface is ink (`#0F100D`, about 5.9:1) or the text is large enough for the large-text rule. Orange text on a light background is `#C23F00`, never `#FC5200`.
4. **Every string lives in `src/shared/i18n/es.ts`.** No literal copy inside components.

## Scope

**Inside**: `src/features/landing/`, the landing additions to `src/shared/i18n/es.ts`.

**Outside**: the upload screen (H-06), the processing screen (H-05), the stories (H-07 to H-10), any change to `src/core/`.

## Tasks

- T1 Header, hero and the example card, mobile first and desktop · worker · commit 1
- T2 How it works, the eight story previews, the privacy strip, the FAQ and the footer · worker · commit 2
- T3 Copy in `es.ts` with the CSV delta applied, plus a test that no string asks for a zip · worker · commit 2
- T4 Verify at 390×844 and 1440×900 in both themes, axe clean, and record the evidence · parent · commit 3

## Evidence of verification

### `pnpm check` — green

`tsc` · `eslint` · `prettier --check` · **99 tests** in 15 files · `depcruise` 46 modules / 68 dependencies · both repo guards.

### `pnpm verify` — the real screenshots

```
--viewport mobile --theme both    6 screenshots · 248 requests · 0 console problems
--viewport desktop --theme both   6 screenshots · 248 requests · 0 console problems
```

Network log of the run: **one origin**, `http://127.0.0.1:5173`, and **zero external entries**. The landing loads no third party, which is the privacy rule of BRIEF §8 holding at the presentation layer too.

Reviewed by eye in all four combinations. What the screenshots confirm:

- The three deltas are visible: the call to action says "Subir mi activities.csv", the hero card is captioned **EJEMPLO**, and every piece of text on an orange surface is ink, not white.
- Section order matches the artboard: header, hero with the two-column desktop layout, three-step strip, eight story previews, orange privacy strip, six-question FAQ, footer.
- The only mention of a zip in the whole copy is the FAQ answer explaining how to unzip the download: "…zip. Descomprímelo y sube el archivo acti…".

### `pnpm test:e2e` — 15 passed

The first run failed axe with `aria-required-children` on the story scroll container (`role="list"` wrapping a `<ul>`). Fixed by using native `ul`/`li` semantics with an `aria-label` on the list, with no visual change. **The axe assertion was not weakened**; the second run is green including the three accessibility assertions.

### Known deviations from the artboard, accepted

| Deviation                                                                                                                  | Why                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Story preview cards 05 and 06 use new art (archetype text, "842 km") instead of the artboard's signature squiggle and shoe | BRIEF §6.2 replaced "Tu firma" with "Tu material", so the artboard's art describes a story that no longer exists |
| Story 01 gained a "2026" figure where the artboard starts at 02                                                            | The story's subject is the season itself                                                                         |
| About two preview cards visible at 390 px                                                                                  | Matches the artboard's card size; the row scrolls horizontally and is reachable by keyboard                      |
| Dark-theme shadows are token-based rather than the artboard's inline `rgba(0,0,0,0.5)`                                     | Raw shadow values live in the tokens, not in components                                                          |

### Composition note for review

The page shows two stacked footer bands: the landing's own footer (brand, copyright, nav) and the app shell's notices band (the non-affiliation notice required by BRIEF §2). They carry different information and neither is duplicated verbatim, but it reads as two bands on desktop.

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session, authorising the milestone chain to continue:

> continúa

L2 — Design tooling note: the `gentle-design` canvas is not used for this milestone. The design source of truth here is the frozen artboards plus the tokens already derived from them in H-00, so there is no `design/system.md` to sync and no new design direction to choose. This milestone implements an existing design and applies the three deltas above.
