# Design system — Dorsal

Synced read-only from the project sources. Every value below comes verbatim from
the listed file; nothing is invented. Artboards under `design/` must use these
tokens and this component vocabulary.

Sources read:

- `src/shared/tokens/tokens.css` (all custom properties)
- `src/shared/styles/global.css` (base rules, focus, selection, reduced motion)

Font loading note: the tokens declare `'Anton'`, `'Inter'` and
`'JetBrains Mono'`, but no `@font-face` or hosted font files exist in the repo.
Artboards are self-contained and may not fetch remote fonts, so they render the
declared stacks with their system fallbacks: Anton → `Impact`/`Haettenschweiler`/`Arial Narrow Bold`, Inter → `system-ui`, JetBrains Mono → `ui-monospace`/`SFMono-Regular`.

## Fonts

| Token | Value | Source |
| --- | --- | --- |
| `--font-display` | `'Anton', 'Impact', sans-serif` | `src/shared/tokens/tokens.css` |
| `--font-sans` | `'Inter', system-ui, -apple-system, sans-serif` | `src/shared/tokens/tokens.css` |
| `--font-mono` | `'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace` | `src/shared/tokens/tokens.css` |

Headings (`h1`–`h3`) use `--font-display`, weight 400, `line-height: 0.95`, `text-wrap: balance` (`src/shared/styles/global.css`).

## Brand palette — `--color-*`

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--color-ink` | `#0f100d` | Darkest surface / strongest text | `src/shared/tokens/tokens.css` |
| `--color-bone` | `#f2f0e9` | Light paper surface | `src/shared/tokens/tokens.css` |
| `--color-orange` | `#fc5200` | Accent fill, graphics ≥ 3:1 on ink and bone | `src/shared/tokens/tokens.css` |
| `--color-orange-text` | `#c23f00` | Accent as text on bone surfaces (4.6:1) | `src/shared/tokens/tokens.css` |
| `--color-raised` | `#1c1d18` | Raised dark surface | `src/shared/tokens/tokens.css` |
| `--color-panel` | `#161712` | Panel dark surface | `src/shared/tokens/tokens.css` |
| `--color-dim` | `#2c2e26` | Dim dark surface | `src/shared/tokens/tokens.css` |
| `--color-line-dark` | `#34362e` | Hairline on dark surfaces | `src/shared/tokens/tokens.css` |
| `--color-line-light` | `#d3d1c7` | Hairline on light surfaces | `src/shared/tokens/tokens.css` |
| `--color-bone-dim` | `#d3d1c7` | Bone variant | `src/shared/tokens/tokens.css` |
| `--color-bone-muted` | `#e2e0d6` | Bone variant | `src/shared/tokens/tokens.css` |
| `--color-bone-soft` | `#c9c8bf` | Bone variant | `src/shared/tokens/tokens.css` |
| `--color-bone-faint` | `#9a9b91` | Bone variant, weakest text on dark (≥ 6:1) | `src/shared/tokens/tokens.css` |
| `--color-body-ink` | `#4a4b44` | Body text on bone | `src/shared/tokens/tokens.css` |
| `--color-label-ink` | `#5e5f58` | Label text on bone | `src/shared/tokens/tokens.css` |
| `--color-text-ink` | `#1a1b16` | Text ink on bone | `src/shared/tokens/tokens.css` |

## Theme variables — light (`:root`)

| Token | Value | Source |
| --- | --- | --- |
| `--dorsal-bg` | `#ffffff` | `src/shared/tokens/tokens.css` |
| `--dorsal-surface` | `#f2f0e9` | `src/shared/tokens/tokens.css` |
| `--dorsal-surface-strong` | `#e2e0d6` | `src/shared/tokens/tokens.css` |
| `--dorsal-surface-dim` | `#eceae2` | `src/shared/tokens/tokens.css` |
| `--dorsal-fg` | `#0f100d` | `src/shared/tokens/tokens.css` |
| `--dorsal-fg-muted` | `#4a4b44` | `src/shared/tokens/tokens.css` |
| `--dorsal-fg-subtle` | `#5e5f58` | `src/shared/tokens/tokens.css` |
| `--dorsal-line` | `#d3d1c7` | `src/shared/tokens/tokens.css` |
| `--dorsal-accent` | `#fc5200` | `src/shared/tokens/tokens.css` |
| `--dorsal-accent-text` | `#c23f00` | `src/shared/tokens/tokens.css` |
| `--dorsal-accent-on-bone` | `#c23f00` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-1` | `#eceae2` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-2` | `#fdcbb3` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-3` | `#fd8a55` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-4` | `#fc5200` | `src/shared/tokens/tokens.css` |

## Theme variables — dark (auto via media query and `[data-theme='dark']`)

| Token | Value | Source |
| --- | --- | --- |
| `--dorsal-bg` | `#0f100d` | `src/shared/tokens/tokens.css` |
| `--dorsal-surface` | `#1c1d18` | `src/shared/tokens/tokens.css` |
| `--dorsal-surface-strong` | `#161712` | `src/shared/tokens/tokens.css` |
| `--dorsal-surface-dim` | `#2c2e26` | `src/shared/tokens/tokens.css` |
| `--dorsal-fg` | `#f2f0e9` | `src/shared/tokens/tokens.css` |
| `--dorsal-fg-muted` | `#c9c8bf` | `src/shared/tokens/tokens.css` |
| `--dorsal-fg-subtle` | `#9a9b91` | `src/shared/tokens/tokens.css` |
| `--dorsal-line` | `#34362e` | `src/shared/tokens/tokens.css` |
| `--dorsal-accent` | `#fc5200` | `src/shared/tokens/tokens.css` |
| `--dorsal-accent-text` | `#fc5200` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-1` | `#24261f` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-2` | `#6b2a0e` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-3` | `#b83d07` | `src/shared/tokens/tokens.css` |
| `--dorsal-heat-4` | `#fc5200` | `src/shared/tokens/tokens.css` |

Rule carried with the dark set: on qualities of bone the accent stays
`--dorsal-accent-on-bone` (`#c23f00`); the bright orange `#fc5200` only clears
3:1 as graphics on dark, never as small text on bone.

## Semantic mapping — `@theme inline`

| Token | Value | Source |
| --- | --- | --- |
| `--color-bg` | `var(--dorsal-bg)` | `src/shared/tokens/tokens.css` |
| `--color-surface` | `var(--dorsal-surface)` | `src/shared/tokens/tokens.css` |
| `--color-surface-strong` | `var(--dorsal-surface-strong)` | `src/shared/tokens/tokens.css` |
| `--color-surface-dim` | `var(--dorsal-surface-dim)` | `src/shared/tokens/tokens.css` |
| `--color-fg` | `var(--dorsal-fg)` | `src/shared/tokens/tokens.css` |
| `--color-fg-muted` | `var(--dorsal-fg-muted)` | `src/shared/tokens/tokens.css` |
| `--color-fg-subtle` | `var(--dorsal-fg-subtle)` | `src/shared/tokens/tokens.css` |
| `--color-line` | `var(--dorsal-line)` | `src/shared/tokens/tokens.css` |
| `--color-accent` | `var(--dorsal-accent)` | `src/shared/tokens/tokens.css` |
| `--color-accent-text` | `var(--dorsal-accent-text)` | `src/shared/tokens/tokens.css` |
| `--color-heat-1` | `var(--dorsal-heat-1)` | `src/shared/tokens/tokens.css` |
| `--color-heat-2` | `var(--dorsal-heat-2)` | `src/shared/tokens/tokens.css` |
| `--color-heat-3` | `var(--dorsal-heat-3)` | `src/shared/tokens/tokens.css` |
| `--color-heat-4` | `var(--dorsal-heat-4)` | `src/shared/tokens/tokens.css` |

## Radius

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--radius-pill` | `999px` | Buttons, bars, pills | `src/shared/tokens/tokens.css` |
| `--radius-card` | `18px` | Cards (share previews) | `src/shared/tokens/tokens.css` |
| `--radius-panel` | `14px` | Story panels | `src/shared/tokens/tokens.css` |
| `--radius-chip` | `10px` | Chips | `src/shared/tokens/tokens.css` |

## Shadows

No shadow design tokens are defined in `src/shared/tokens/tokens.css`. Shadows
appear in components as authored values, recorded here as observed usage:

| Usage | Value | Source |
| --- | --- | --- |
| Landing example card | `0 30px 70px rgba(15,16,13,0.35)` | `src/features/landing/landing-screen.tsx` |
| Share card previews | Tailwind `shadow-xl` | `src/features/share/bib-card-preview.tsx` |
| Punched-hole inset | Crescent shapes drawn in the share renderer (decorative, not text) | `src/features/share/render-bib-card.ts` |

## Spacing

The project defines no custom spacing tokens (`src/shared/tokens/tokens.css`
contains none). Spacing follows the Tailwind CSS v4 default scale used by the
utilities throughout `src/` (base step 0.25 rem = 4 px). These are framework
defaults, not project tokens.

## Component rules (observed in the code, not invented)

- Accent use: `--dorsal-accent` for fills and graphics; `--dorsal-accent-text`
  for orange text. On bone surfaces the accent text is always `#c23f00`,
  regardless of theme (`.bg-bone` rule, `src/shared/tokens/tokens.css`).
- Headings: display font, weight 400, `line-height: 0.95`, balanced wrapping.
- Focus: `outline: 2px solid var(--dorsal-accent)`, offset 2 px
  (`src/shared/styles/global.css`).
- Selection: accent background with `#ffffff` text (`src/shared/styles/global.css`).
- Motion: `prefers-reduced-motion: reduce` collapses all animation and
  transition durations (`src/shared/styles/global.css`).
- Common shapes in features: `rounded-pill`, `rounded-panel`, `rounded-card`,
  `rounded-chip`, hairline `border-line`, dashed borders for drop/upload areas.
- White (`#ffffff`) only on accent orange for large display use (3.3:1); body-size
  text on orange is not an established pairing in the sources.
