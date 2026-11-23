# H-01: Data gate (go/no-go)

Feature document for milestone H-01 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — Acceptance criteria (BRIEF §9, H-01, verbatim):

> Formato real de `activities.csv` documentado con al menos un CSV de cuenta en ES y otro en EN, incluida la zona horaria de `Activity Date`. Generador de fixtures que lo reproduce. Si el formato impide alguna historia, se registra y Albert decide. **Bloquea H-02.**

S2 — What the brief believed was unconfirmed (BRIEF §5.2, verbatim):

> - Si las cabeceras cambian según el idioma de la cuenta (ES/EN).
> - El formato exacto de `Activity Date` y si está en UTC o en hora local. Sin los ficheros GPS no hay otra fuente de hora local, así que esto decide cómo se calcula el año y el arquetipo (sección 5.4).
> - Nombre y formato de las columnas de material (`Activity Gear`) y de esfuerzo relativo.
> - Separador decimal y de miles según el idioma de la cuenta.
> - Tamaño real de un CSV con muchos años (estimación: unos pocos MB).

S3 — What was already known (BRIEF §5.2, verbatim):

> - Tiene **dos columnas llamadas `Distance`**: una en km o m según el deporte, y otra siempre en metros. Hay que leer por posición, nunca por nombre.
> - Algunos números vienen con separador de miles (por ejemplo `1,500` en natación), así que el parser no puede asumir un número limpio.

S4 — Privacy of the reference export (BRIEF §5.2, verbatim):

> **Ningún CSV real se sube al repo**: Albert usa el suyo en local, fuera de git.

S5 — Albert, this session, verbatim:

> aqui tienes el csv, bueno la ruta "C:\Users\alber\Downloads\export_36758316 (1)\activities.csv"

S6 — The corpus available (Albert, this session, verbatim):

> solo tengo mi activities.csv de momento.

## Findings from the reference export

Measured with Papa Parse over the real file. Structure only: no activity values, names, dates or gear names from the reference export are reproduced here or committed anywhere.

| Question (S2)          | Answer                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Localized headers?     | **Yes.** The whole header of the reference export is in Spanish. A name-based reader cannot work.                           |
| Exact duplicated names | **Five**, not two: `Tiempo transcurrido`, `Distancia`, `Frecuencia cardiaca máxima`, `Esfuerzo Relativo`, `Desplazamiento`. |
| Column count           | **104** fields, every row with exactly 104 fields, zero parser errors.                                                      |
| `Activity Date` format | `d MMM yyyy, H:mm:ss`, 24-hour clock, no AM/PM, Spanish month abbreviations including the four-letter `sept`.               |
| Timezone               | **No offset, no zone marker anywhere in the file.**                                                                         |
| Decimal separator      | Spanish: comma for the km column, dot for the metre column. No thousands separators in this export.                         |
| Gear                   | Single free-text column, frequently empty. Only two distinct values in the whole history.                                   |
| Relative effort        | **Present** and well populated, so the v1.1 "hardest day" story is viable.                                                  |
| Size                   | 0.3 MB for 913 activities across seven years, so the few-MB estimate holds.                                                 |

Consequences written into `docs/export-format.md`: every column is read by index through a per-locale map, the date parser must accept localized month names, and the distance comes from the metre column.

## Tasks

- T1 `docs/export-format.md` with the column index map, the date format, the number rules and the timezone limit · S1,S2,S3 · inline · commit 1
- T2 `fixtures/generator` reproducing that format, with the nine personas of AGENTS.md §2 · S1 · worker · commit 2
- T3 Generator test: 104 columns, localized header and date shape, distance and time units, spans several years · S1,S3 · worker · commit 2
- T4 `pnpm fixtures` wiring and `fixtures/generated/` policy · S1,S4 · inline · commit 2
- T5 Record the story impact and the EN gap · S1,S6 · inline · commit 3

## Out of scope

`src/core/export-reader/` and the 2026 filter code (H-02), the metrics (H-03), the `.zip` handling decision (BRIEF §13.6).

## Evidence of verification

All commands on branch `feature/h01-export-format`.

### `pnpm check` — green

```
tsc --noEmit (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)   no output
eslint .                                                                      no output
prettier --check .                                                            clean
vitest run                                                                    Test Files 3 passed (3) · Tests 31 passed (31)
depcruise src                                                                 32 modules, 43 dependencies, 0 violations
check:no-real-exports                                                         clean
check:brand                                                                   clean
```

31 tests: the 17 from H-00 plus 14 from `tests/fixtures/generator.test.ts`.

### Independent check, outside the generator's own test

The generated files were validated by a separate script that parses `fixtures/generated/*.csv` from disk with Papa Parse, not by importing the generator:

```
broken-rows.csv:         rows 42 (malformed 1) | 2026  12 | sept dates 0
cyclist.csv:             rows 548 (malformed 0) | 2026 100 | sept dates 43
few-activities.csv:      rows 3 (malformed 0)  | 2026   3
multisport.csv:          rows 236 (malformed 0) | 2026 90 | sports above 10 % of moving time: 3
no-2026.csv:             rows 192 (malformed 0) | 2026   0
no-gear.csv:             rows 180 (malformed 0) | 2026 30
runner-es.csv:           rows 356 (malformed 0) | 2026 100
ten-years-history.csv:   rows 204 (malformed 0) | 2026 28
year-boundaries.csv:     rows 13 (malformed 0)  | 2026  6
ALL CHECKS PASSED
```

Asserted per file: header is 104 fields with `Fecha de la actividad` at index 1 and `Distancia` at 6 and 17; every date matches the documented `d MMM yyyy, H:mm:ss` shape including `sept`; index 17 equals index 6 × 1000 within 0.05 for every row; moving time never exceeds elapsed time; `no-2026` has zero 2026 rows; `few-activities` has exactly 3; `broken-rows` carries one row with 103 fields; `year-boundaries` contains the 2025-12-31 23:3x exclusion and the 2026-01-01 00:1x and 2026-12-31 23:5x inclusions; `multisport` has three sports above 10 % of moving time.

### Determinism

`pnpm fixtures` twice, with a copy of the output taken in between: `diff -r` reports no difference, so the fixtures are byte-identical across runs.

### Data safety

`fixtures/generated/` is git-ignored, so no generated CSV is committed. `pnpm check:no-real-exports` still passes, and no artifact from the reference export exists in the tree or in git.

## Progress

T1 to T5 done. H-02 (the reader) is unblocked.

## Next step

H-02: `src/core/export-reader/`, `src/core/model/`, `src/core/time/`, reading by index through the map in `docs/export-format.md`, with the BRIEF §5.4 boundary cases pinned against the `year-boundaries` and `ten-years-history` personas.

## Log

L1 — Albert, this session (message that opened H-01):

> aqui tienes el csv, bueno la ruta "C:\Users\alber\Downloads\export_36758316 (1)\activities.csv"

L2 — Albert, this session:

> solo tengo mi activities.csv de momento.

Decision from L2, recorded as a scope change rather than a silent narrowing: S1 asks for an ES **and** an EN export. Only an ES export exists. `docs/export-format.md` documents the ES layout as verified and marks the EN layout as **unverified assumption** (same 104 columns in the same order, English names). The generator emits the ES layout; an EN persona is not invented, because a guessed fixture would create false confidence. Albert decides whether the residual risk is acceptable for v1 or whether he looks for an EN account before H-12.

L4 — Policy decision, recorded because it changes what CI does: generated fixtures are **not committed**. They are byte-reproducible from `pnpm fixtures`, and committing nine CSVs would add 400 KB of generated data to a public repository. `.gitignore` ignores `fixtures/generated/`, and the end-to-end CI job runs `pnpm fixtures` before `pnpm test:e2e`.

L3 — Scope note: H-01 depends on the toolchain from H-00 (`pnpm`, the generator script and its test runner), so this branch is stacked on `feature/h00-bootstrap` (PR #1) instead of `dev`, following `chained-pr`. When PR #1 merges, this PR retargets to `dev`.
