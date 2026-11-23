# H-06: Upload and error states

Feature document for milestone H-06 of `BRIEF.md`. Read until `## Log` before implementing.

## Specs

S1 — The error states, verbatim (BRIEF §7):
> Estados de error con copy propio: no es un CSV, el CSV no es de Strava (faltan columnas), han subido el `.zip` en vez del CSV (se explica cómo sacar el CSV), sin actividades en 2026, filas corruptas (se ignoran y se avisa), navegador sin soporte.

S2 — Quick validation happens on the main thread before the worker sees anything (BRIEF §4.2, verbatim):
> 1. El usuario elige `activities.csv` en `/subir`. Validación rápida en el hilo principal: extensión y tamaño.

S3 — Acceptance criteria (BRIEF §9, H-06, verbatim):
> Todos los estados de error de la sección 7 con su e2e.

S4 — The year filter's own error case (BRIEF §5.4, verbatim):
> Si no hay ninguna actividad de 2026, se muestra un error propio ("Este archivo no tiene actividades de 2026") y no se abre el wrapped.

S5 — Privacy and boundaries (BRIEF §8, AGENTS §5.1): no network, nothing persisted, only `src/worker/` may import `src/core/export-reader/`.

S6 — Copy lives in `src/shared/i18n/` (BRIEF §2, S7 of H-04) and the input is the CSV, never the zip (Albert, verbatim):
> Es en vez de subir .zip, es subir csv no hay mas.

## Context: the defect this milestone must make impossible

The first real export produced **zeros on screen** instead of an error, because no activity survived the season filter and the result screen rendered a summary of zeroes. Albert could not tell whether his file was wrong or the app was. A silent zero is worse than a loud failure, so `inSeason === 0` becomes a first-class error state here, not a rendering detail.

## Decisions this document fixes

1. **Two validation layers, each where it belongs.** The extension and the size are checked on the main thread, before the `File` reaches the worker (S2). Everything that needs to read bytes — is this actually a Strava export, did they pick the zip, how many rows are unreadable — is decided in the worker, which is the only place allowed to import the reader (S5).
2. **A zip is detected by content, not only by name.** If the first bytes are `PK\x03\x04`, the state is "you uploaded the zip", with the copy explaining how to extract `activities.csv`. The extension check catches the common case first; the byte check catches a renamed file.
3. **A file with rows but no 2026 activity is an error state**, with the counts in the copy ("913 actividades, ninguna de 2026"), never a summary of zeroes (S4).
4. **Corrupt rows warn and continue.** The analysis completes, the screen says how many rows were ignored, and the season numbers are still shown.
5. **Unsupported browser is detected before the picker renders**, by checking the APIs the flow needs (`Worker`, `File`, `FileReader`). The state explains what is missing instead of failing later.
6. **Size limit: 50 MB.** Above it the upload is refused with its own message. The reference export is 0.3 MB, so this only catches a mistake, and the number is documented instead of being implicit.
7. **The worker contract carries the counters.** `AnalyzeOutcome` gains the read stats next to the summary, because the "filas corruptas" warning and the "sin actividades de 2026" message both need numbers the summary does not carry.

## Scope

**Inside**: `src/features/upload/`, `src/worker/` (contract, analyze, client), `src/shared/i18n/`, the minimum in `src/features/processing/` and `src/features/wrapped/` to route the new outcomes, `e2e/`.

**Outside**: the story player (H-07), the stories, the share card.

## Tasks

- T1 Worker: typed failures `notStrava`, `zipInsteadOfCsv`, and read stats on success, with unit tests over in-memory CSV text plus a byte-level zip probe · worker · commit 1
- T2 Upload screen: real picker with drag and drop, main-thread extension and size validation, unsupported-browser detection, and one rendered state per S1 case with its own copy · worker · commit 2
- T3 Route the new outcomes: corrupt-rows warning on the result, `no-2026` refusal, and the error states wired through · worker · commit 2
- T4 e2e for every state: `.zip` by name and by bytes, a CSV that is not a Strava export, `no-2026`, `broken-rows`, and a file over the size limit · parent · commit 3

## Evidence of verification

(filled at T4)

## Progress

T1 pending.

## Next step

T1.

## Log

L1 — Albert, this session:
> sigue

L2 — Priority recorded: the silent-zeros state goes first, because it already happened with a real file and it is the failure that hides evidence instead of showing it.
