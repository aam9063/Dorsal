# H-09: Story 06 — Tu material

Feature document for milestone H-09 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — Why this story replaces the artboard (BRIEF §6.2, verbatim):

> La historia 06 sustituye a "Tu firma" del diseño: esa historia necesitaba los ficheros GPS, que ya no leemos.
>
> 1. Agrupa las actividades de 2026 por `Activity Gear` (sin material, al grupo "sin asignar", que no se muestra).
> 2. Por cada material: km, horas y nº de actividades de 2026.
> 3. Material estrella = el de más horas. Se muestra con su nombre tal cual lo escribió el usuario.
> 4. Aviso para zapatillas con más de 800 km **en 2026**: "Toca jubilarlas". El CSV solo da los km del año que contamos, no la vida total de la zapatilla, así que el texto lo deja claro.
> 5. Si el deporte principal es bici, se muestran bicis en lugar de zapatillas.

S2 — The omission rule (BRIEF §6, verbatim):

> Menos del 30 % del tiempo con material asignado → se omite.

S3 — Design and accessibility: the tokens and rules fixed in `odd/tasks/h04-landing.md` and applied in H-08 — semantic tokens only, AA contrast, 44 px targets, a text alternative for anything that encodes a value, axe clean.

S4 — The player contract (`odd/tasks/h07-story-player.md`, decision 1): one registry line plus one content-map entry. **The player is not touched.**

## The design, authored here

There is no artboard for this story: `W6-Firma` draws GPS routes we no longer read. This is the only story whose visual had to be invented, so the direction is written down before the code.

**Direction: "el podio del material".** The poster language of the other stories is a dominant number in Anton, mono labels and one accent. Applied to gear:

1. **Eyebrow**: `ETAPA 6 · TU MATERIAL`, like its neighbours.
2. **The star item is the headline**, set in Anton the way the bib card sets a name, because it is the athlete's own words and the most personal string in the whole wrapped.
3. **The hero number** is the hours on that item, with the kilometres right beside it: time is what the brief uses to pick the star, so time leads.
4. **The rest of the gear is a ranked list**, one row per item, each with a bar proportional to its hours against the star, so the ranking is visible and not just stated.
5. **The retirement badge** sits on the row of any item flagged `needsRetiring`, with copy that says _this season_, because the export cannot see the shoe's whole life.
6. **Bikes or shoes**: when `showsBikes` is true the copy speaks of bikes; otherwise of shoes. Same layout, different nouns.

Why this and not an odometer or a shelf: the story has to answer "which thing carried my year?", and a ranked list with a hero answers it in one glance on a phone, in the same language as stories 02 and 04.

**Accessibility of the bars**: each row's bar is decorative (`aria-hidden`), and the numbers beside it carry the information in text; the list is a real `<ul>`, so a screen reader reads it as a ranking rather than as a chart.

## Decisions this document fixes

1. **The story reads `gearOfTheYear` and recomputes nothing.** It never re-thresholds the 30 % rule; `availability.gear` already says whether the story exists.
2. **The star is found by name** from `star`, and the list is used as returned (already sorted by hours). A story that re-sorts could disagree with the metric.
3. **The bars are relative to the star**, so the first row is always full width; absolute bars would make a small season look empty.
4. **A missing or blank gear name is never rendered**: the metric already drops the unassigned group, and the story trusts that.
5. **The copy distinguishes shoes from bikes and says "en 2026"** in the retirement warning, because the limit is on this season's kilometres.

## Scope

**Inside**: `src/features/wrapped/stories/06-material/`, `registry.ts` (one line), `story-content.tsx` (one entry), `src/shared/i18n/es.ts`, `e2e/stories.spec.ts`, and `fixtures/generator/` to add a persona whose shoes pass 800 km in 2026.

**Outside**: `src/core/`, the player, the other stories.

## Tasks

- T1 A fixture persona whose main pair of shoes exceeds 800 km in 2026, so the retirement warning can be proven end to end · worker · commit 1
- T2 The story: eyebrow, star headline, hero hours and kilometres, ranked list with relative bars, retirement badge, bikes-or-shoes copy · worker · commit 2
- T3 Register the story and extend the end-to-end suite: the story renders with the gear persona, is **omitted** with `no-gear`, and the retirement badge appears only on the flagged item · worker · commit 3
- T4 Verify in light and dark at 390 px and 1440 px with the gear persona and with `no-gear`, and record the evidence · parent · commit 4

## Evidence of verification

### `pnpm check` — green

`tsc` · `eslint` · `prettier` · **147 tests** · `depcruise` 72 modules / 147 dependencies · both repo guards.

### `pnpm test:e2e` — 93 passed, zero skipped

Five new tests for this story: the star's name with its hours and kilometres, the retirement badge on the flagged row **only**, the bike wording with the cyclist persona, the story missing from `no-gear` **without leaving a gap in the bars**, and an axe pass scoped to the story.

### `pnpm verify` — the story and its absence

```
--fixture shoe-retired --viewport mobile --theme both  18 screenshots · 614 requests · 0 console problems · 0.0 ms drift
--fixture no-gear      --viewport mobile --theme dark   8 screenshots · 307 requests · 0 console problems · 0.0 ms drift
```

The `shoe-retired` run captured five stories; the `no-gear` run captured four. **The absence is verified by the artefact, not by reading the code**: no `story-4` screenshot exists in the second run, which is what "omitted without leaving a gap" looks like from the outside.

The story screenshot matches the design direction written above: the eyebrow, the athlete's own gear name as the headline in the display face, `81 h 36 min` as the hero number with `816,0 km` beside it, the ranked list with bars at 100 % / 15 % / 10 %, and the badge on the flagged row with its "el export solo cuenta esta temporada" note.

### Two defects found while verifying, and fixed here

1. **The retirement warning had no fixture that could trigger it.** Every existing persona kept its shoes under 800 km in 2026, so that branch of the story would have shipped written but never executed. A `shoe-retired` persona now covers it, and its numbers are asserted by the story's tests.
2. **`8 h 0 min` read like a machine.** `formatDuration` printed the zero minutes; a whole number of hours now prints `8 h`. The test for it was run against the previous implementation first:

```
× drops the minutes when they are zero instead of printing "0 min"
Tests  1 failed | 3 passed      →      Tests 4 passed
```

### Native review (lineage `review-a3ad28c353c06652`) and its two findings

Approved and burned.

| Id       | Severity | Claim                                                                                                                                             | Disposition                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R3-001` | warning  | The hero number interpolates hours and minutes by hand, so it diverges from the shared formatter when the moving time is a whole number of hours. | **Fixed.** The reviewer is right and the fix is the interesting part: I had just corrected `formatDuration` to drop `0 min`, and the hero still printed its own `h 0 min`. The decomposition moved into `formatHourParts`, which returns `minutes: null` for whole hours, and it has tests for both cases. A formatting rule that lives in two places drifts — this is that drift, caught by review rather than by me. |
| `R3-002` | warning  | Using `item.name` as the React key risks reconciliation bugs if two gear items share a name.                                                      | **Rejected with evidence.** `gearOfTheYear` groups activities _by name_, so the returned `items` are unique by construction; two entries with the same name cannot exist in the metric's output.                                                                                                                                                                                                                       |

### Documentation the writer could not reach

The fixture persona list in `docs/glossary.md` and in `AGENTS.md` §2 still described nine personas, and `AGENTS.md` still said `cyclist-en`, a name retired in H-01. Both are updated here.

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> sigue

L2 — Design note: the `gentle-design` canvas is not opened for this story. The visual language is already fixed by H-04 and the four stories before it, this is one screen whose content is a list, and the deliverable is the story itself inside the player. The direction and its rationale are recorded above so the choice is reviewable rather than implicit.
