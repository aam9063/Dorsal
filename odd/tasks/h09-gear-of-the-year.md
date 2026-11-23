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

(filled at T4)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:

> sigue

L2 — Design note: the `gentle-design` canvas is not opened for this story. The visual language is already fixed by H-04 and the four stories before it, this is one screen whose content is a list, and the deliverable is the story itself inside the player. The direction and its rationale are recorded above so the choice is reviewable rather than implicit.
