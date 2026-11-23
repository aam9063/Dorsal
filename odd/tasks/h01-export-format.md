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

(filled at T5)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session (message that opened H-01):

> aqui tienes el csv, bueno la ruta "C:\Users\alber\Downloads\export_36758316 (1)\activities.csv"

L2 — Albert, this session:

> solo tengo mi activities.csv de momento.

Decision from L2, recorded as a scope change rather than a silent narrowing: S1 asks for an ES **and** an EN export. Only an ES export exists. `docs/export-format.md` documents the ES layout as verified and marks the EN layout as **unverified assumption** (same 104 columns in the same order, English names). The generator emits the ES layout; an EN persona is not invented, because a guessed fixture would create false confidence. Albert decides whether the residual risk is acceptable for v1 or whether he looks for an EN account before H-12.

L3 — Scope note: H-01 depends on the toolchain from H-00 (`pnpm`, the generator script and its test runner), so this branch is stacked on `feature/h00-bootstrap` (PR #1) instead of `dev`, following `chained-pr`. When PR #1 merges, this PR retargets to `dev`.
