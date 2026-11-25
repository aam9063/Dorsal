# English version and language selector

Feature document for the English version of Dorsal. Read until `## Log` before implementing.

## Specs

S1 — Albert's request (L1, verbatim):

> Vale quiero hacer la versión en inglés, que tenga para seleccionar idioma

S2 — First visit (L2): the app starts in the visitor's language — `navigator.language` beginning with `en` means English, anything else means Spanish — and the selector can always change it.

S3 — Scope (L2): **the two shareable cards are translated too**, not only the interface, so what a user shares speaks their language.

S4 — Persistence (L2): the chosen language is remembered, stored next to the theme preference in the only module allowed to touch `localStorage`. This amends `AGENTS.md` §5.1, which today permits storing only the theme preference.

S5 — Hard constraints that keep applying: no network, no user data stored beyond the two preferences, AA contrast, touch targets ≥ 44 px, complete keyboard navigation, `prefers-reduced-motion`, Spanish and English copy living in `src/shared/i18n/`, no third-party brand, only 2026 aggregates leaving the worker.

S6 — What does not change: routes stay as they are (`/subir`, `/resultado`), metrics and copy meaning stay the same, story reading budgets stay, the privacy test keeps forbidding any other storage key, and the cards stay deterministic in both locales.

## Decisions this document fixes

1. **`t` stops being a static import.** The app reads the strings through a reactive accessor backed by a store, the way the theme already works, so changing the language re-renders every screen without a reload. A component must never import a locale object directly.
2. **One file per locale, one closed key set.** `es.ts` is the source of truth for the shape; `en.ts` must satisfy the same type, and a test proves both expose exactly the same keys — a missing translation is a test failure, not a runtime fallback.
3. **Numbers and dates follow the locale too**: `src/shared/format.ts` stops hard-coding `es-ES`.
4. **The stored preference is a second key in the theme module**, renamed to hold preferences, and the privacy test allows exactly those two keys and nothing else.
5. **The cards receive the locale explicitly** rather than reading a global, so their determinism tests can run in both languages from the same inputs.
6. **`<html lang>` follows the choice**, because a screen reader in English must not read Spanish phonetic rules.

## Scope

**Inside**: `src/shared/i18n/` (new `en.ts`, the store, the selector), `src/shared/theme/` (storage), `src/shared/format.ts`, `src/shared/ui/` (the selector control), `src/app/` (wiring, `lang` attribute), every feature that reads copy, `src/features/share/` (locale in the card inputs), `e2e/privacy.spec.ts` (the allowed key list), `AGENTS.md` §5.1, `docs/feature-map.md`.

**Outside**: routes, metrics, the worker protocol, the schema, and the design language.

## Tasks

- T1 Foundation: `en.ts`, the reactive store, `format.ts` locale-aware, `<html lang>`, the storage key, the selector in the header, and the privacy test's allowed-key list · worker · C1
- T2 `src/features/landing/` + `src/features/upload/` + `src/features/processing/`: read copy through the accessor · worker · C2
- T3 `src/features/wrapped/` (result, player, eight stories): same, including dates and numbers · worker · C3
- T4 `src/features/share/`: locale in the card inputs, both previews, and the determinism tests running in both languages · worker · C4
- T5 verification: `pnpm check`, full e2e in both locales, `pnpm verify`, the privacy test, Feature Map and `AGENTS.md` · parent · C5

## Evidence of verification

(filled at T5)

## Progress

Not started.

## Next step

T1.

## Log

L1 — Albert, verbatim: `Vale quiero hacer la versión en inglés, que tenga para seleccionar idioma`

L2 — Albert's three answers, verbatim: first visit `Seguir el idioma del navegador`; cards `Las tarjetas también`; persistence `Recordar el idioma (recomendado)`.

L3 — Consequence recorded: storing the language amends the storage row of `AGENTS.md` §5.1 and the allowed-key list asserted by `e2e/privacy.spec.ts`. Both stay strict: exactly two keys, nothing else.
