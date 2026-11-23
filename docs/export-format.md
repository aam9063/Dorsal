# `activities.csv` export format

The only source of truth for how Dorsal reads the file. Written in H-01 from a reference export of a real account and reproduced by `fixtures/generator/`. Anything not written here is unknown.

**The reference export is never committed.** It lives outside the repository, and this document records structure only: no activity values, names, dates or gear names from it appear here or in any fixture.

## Where the file comes from

The user requests their archive from Strava's account settings. It arrives as a `.zip`; the file Dorsal reads is `activities.csv`, at the root of the unzipped archive. It holds **one row per activity** for the whole history of the account.

Reference export: 104 columns, 0.3 MB, several years of history, zero malformed rows and zero parser errors with Papa Parse. The few-MB estimate in the brief holds.

## Non-negotiable reading rules

1. **Columns are read by index, never by name.** The header is written in the language of the account: the reference export is entirely in Spanish (`ID de actividad`, `Fecha de la actividad`, `Distancia`, …). A name-based reader breaks on the first non-English account.
2. **Five header names appear twice**, so even a correct name lookup is ambiguous:

   | Name                         | Indices |
   | ---------------------------- | ------- |
   | `Tiempo transcurrido`        | 5, 15   |
   | `Distancia`                  | 6, 17   |
   | `Frecuencia cardiaca máxima` | 7, 30   |
   | `Esfuerzo Relativo`          | 8, 37   |
   | `Desplazamiento`             | 9, 50   |

3. **Every value is a string.** Empty means absent, not zero: a missing heart rate is `""`. Do not coerce blindly.
4. **Numbers are localized.** The kilometre distance uses a comma as the decimal separator; the metre distance uses a dot. No thousands separators appeared in the reference export, but the brief documents them for other exports, so the parser strips them rather than trusting a clean number.

## Column map (Spanish layout, verified)

Only the columns Dorsal needs are listed. Indices are the contract.

| Index | Spanish header                 | Type               | Meaning                                                                           |
| ----- | ------------------------------ | ------------------ | --------------------------------------------------------------------------------- |
| 0     | `ID de actividad`              | integer            | Activity id, unique per row                                                       |
| 1     | `Fecha de la actividad`        | localized datetime | Local start time, see below                                                       |
| 2     | `Nombre de la actividad`       | text               | Title. **Personal data: never leaves the worker and is not needed by any story.** |
| 3     | `Tipo de actividad`            | localized text     | Sport label, see the sport map                                                    |
| 4     | `Descripción de la actividad`  | text               | Usually empty. Personal data, unused                                              |
| 5     | `Tiempo transcurrido`          | integer seconds    | Elapsed time, no decimals                                                         |
| 6     | `Distancia`                    | decimal with comma | Display distance in km                                                            |
| 7     | `Frecuencia cardiaca máxima`   | integer bpm        | Max heart rate, well populated                                                    |
| 8     | `Esfuerzo Relativo`            | integer            | Relative effort. v1.1 material                                                    |
| 11    | `Equipamiento de la actividad` | text               | Gear name as the user typed it, frequently empty                                  |
| 15    | `Tiempo transcurrido`          | decimal seconds    | Same elapsed time, with `.0`                                                      |
| 16    | `Tiempo en movimiento`         | decimal seconds    | **Moving time**, the one metrics use                                              |
| 17    | `Distancia`                    | decimal with dot   | **Distance in metres**, more precise than index 6                                 |
| 20    | `Desnivel positivo`            | integer metres     | Elevation gain                                                                    |
| 30    | `Frecuencia cardiaca máxima`   | integer bpm        | Second occurrence, sparse. Prefer index 7                                         |
| 31    | `Frecuencia cardiaca promedio` | integer bpm        | Average heart rate                                                                |
| 37    | `Esfuerzo Relativo`            | integer            | Second occurrence                                                                 |
| 103   | `Etiqueta`                     | text               | Tag                                                                               |

Distance check performed on the reference export: index 17 divided by index 6 is 1000 for every non-zero row, so index 17 is metres with one decimal and index 6 is kilometres with two. **Use index 17.**

## Dates and the timezone question

Format: `d MMM yyyy, H:mm:ss`, for example the shape `5 nov 2026, 18:32:11`.

- 24-hour clock, no `AM`/`PM`.
- Spanish month abbreviations: `ene feb mar abr may jun jul ago sept oct nov dic`. Note `sept` has four letters; a three-letter assumption fails in September.
- Day is not zero-padded (`5`, not `05`).

**Timezone: the file carries no offset, no `Z`, no `UTC`/`GMT` marker.** There is no field that could express one.

Dorsal therefore interprets the value as the local wall-clock time Strava itself shows for the activity, and treats it as already local.

**Confirmed, not assumed**: Albert compared an activity in the Strava UI with its row in the export and the time matches, so the value is local wall-clock time. This question is closed; do not reopen it without new evidence.

Consequences, written down rather than discovered later:

- The 2026 filter (BRIEF §5.4) compares the parsed local date against 2026-01-01 00:00 and 2026-12-31 23:59:59.
- An activity recorded while travelling in another timezone lands at the wall-clock time of that place, so it can fall on a different day than it would at home. The brief already accepts this limit for v1.
- There is no residual timezone risk to chase: the comparison above settled it. If a _different_ export is ever found to write UTC, the conversion belongs in `src/core/time/`, in the single function that exists for that purpose.

## Numbers

| Kind                          | Rule                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| Distance (index 6)            | `1.234,56` style: strip thousands separators, comma is the decimal point |
| Distance (index 17)           | `1234.6` style: dot is the decimal point                                 |
| Elevation, heart rate, effort | Plain integers                                                           |
| Elapsed and moving time       | Decimal seconds with a `.0` tail; truncate to whole seconds              |
| Empty cell                    | Absent value, never zero                                                 |

The worker never sees a raw string: parsing and conversion happen in `src/core/export-reader/`, and the year filter happens in `src/core/time/`.

## Sport labels

Localized, so the reader needs a map per language. Spanish labels seen in the reference export and their normalized kind:

| Spanish label                                                             | `SportKind`                                                           |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `Carrera`                                                                 | `run`                                                                 |
| `Bicicleta`                                                               | `ride`                                                                |
| `Bicicleta virtual`                                                       | `ride`                                                                |
| `Caminata`                                                                | `walk`                                                                |
| `Senderismo`                                                              | `hike` (documented in the brief, not present in the reference export) |
| `Natación`                                                                | `swim` (documented in the brief, not present in the reference export) |
| Anything else (`Entrenamiento con pesas`, `Entrenamiento`, `Elíptica`, …) | `other`                                                               |

An unknown label never throws: it becomes `other` with the raw label preserved in `sportRaw`.

## What the reference export says about the stories

- **Relative effort is present and well populated**, so the v1.1 "hardest day" story (BRIEF §6.3) is viable with this column.
- **Average and max heart rate are present for the overwhelming majority of activities**, so the heartbeats story (07) will show for this kind of account.
- **Gear is rarely filled in.** Most activities have no gear, so the "gear of the year" story (06) will be omitted under the 30 % rule of BRIEF §6.2 for accounts like this one. That is the rule working as designed, not a bug: the story needs gear to exist.
- **No story is blocked by the format.**

## Locale variants

| Variant      | Status                                                                                                                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spanish (ES) | **Verified** against the reference export                                                                                                                                                                                                             |
| English (EN) | **Unverified assumption**: the same 104 columns in the same order with English headers (`Activity ID`, `Activity Date`, `Distance`, …). Only indices are trusted, so an English account is expected to work as long as the column order is unchanged. |

The generator emits the ES layout only. Inventing an EN fixture would create false confidence.

## Fixtures

`fixtures/generator/` reproduces this document and nothing else. Generated files go to `fixtures/generated/`, which is git-ignored: they are reproducible, so they are rebuilt with `pnpm fixtures` instead of committed. That directory is also the only place where a `.csv` may be written inside the repository (`.gitignore`, `pnpm check:no-real-exports`). Personas are listed in `AGENTS.md` §2, and every persona spans several years so the 2026 filter is always exercised.
