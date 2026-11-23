# Tooling and models

Versions this repository was bootstrapped with (H-00). `package.json` pins them exactly; this file explains the ones that carry a decision.

## Agent harness

| Item                       | Value                                | How to check                   |
| -------------------------- | ------------------------------------ | ------------------------------ |
| gentle-ai                  | 5.0.0                                | `gentle-ai --version`          |
| gentle-pi (gentle-shell)   | 5.0.0                                | `gentle-pi` package version    |
| Receipt-driven development | on, global scope (clone-local unset) | `gentle-ai review mode status` |
| ODD                        | default workflow of this harness     | `AGENTS.md` section 10         |

RDD stays enabled in this project (BRIEF section 10.2). Its depth depends on the risk of the frozen candidate, which is why the independent review in `AGENTS.md` 10.3 exists as an extra layer for low-risk changes.

## Session model

Recorded from the environment of the bootstrapping session:

| Item            | Value                            |
| --------------- | -------------------------------- |
| Provider        | `nan` (`PI_PROVIDER`)            |
| Model           | `deepseek-v4-flash` (`PI_MODEL`) |
| Reasoning level | medium (`PI_REASONING_LEVEL`)    |

The eval playbook in `AGENTS.md` section 7 wants a run per model configured in gentle-shell for this repository. This table is where that list is completed; today it holds the one model the bootstrap actually ran on, not a claim about what is configured.

## Runtime

| Item                            | Local      | CI                                              |
| ------------------------------- | ---------- | ----------------------------------------------- |
| Node                            | 24.22.1    | 22 (`netlify.toml`, `.github/workflows/ci.yml`) |
| pnpm                            | 11.4.0     | 11.4.0 (`packageManager` field)                 |
| OS of the bootstrapping session | Windows 11 | `ubuntu-latest`                                 |

`engines.node` requires `>=22`. pnpm 11 reads its settings from `pnpm-workspace.yaml`, not from a `pnpm` field in `package.json`; `allowBuilds` there whitelists esbuild's postinstall.

## Build and quality stack

| Layer        | Package                                          | Pinned  | Note                                          |
| ------------ | ------------------------------------------------ | ------- | --------------------------------------------- |
| Bundler      | `vite`                                           | 8.3.8   | Targets `es2022`, ES workers                  |
| UI           | `react`, `react-dom`                             | 19.3.1  | TSX, StrictMode                               |
| Routing      | `react-router`                                   | 8.5.2   | Library mode, three routes                    |
| Styles       | `tailwindcss`, `@tailwindcss/vite`               | 4.3.5   | Tokens in `src/shared/tokens/tokens.css`      |
| Types        | `typescript`                                     | 6.0.3   | See the pin note below                        |
| Unit tests   | `vitest`                                         | 5.1.1   | `environment: node`                           |
| E2E          | `@playwright/test`                               | 1.65.1  | Chromium, mobile 390×844 and desktop 1440×900 |
| A11y         | `@axe-core/playwright`                           | 4.14.0  | Serious and critical violations fail the run  |
| Lint         | `eslint`                                         | 10.15.0 | Flat config, `typescript-eslint` 8.73.0       |
| Architecture | `dependency-cruiser`                             | 18.8.0  | Boundaries of BRIEF 4.3                       |
| Format       | `prettier`                                       | 3.10.1  | `semi: false`, single quotes, 100 columns     |
| Domain       | `zod`                                            | 4.6.7   | `YearSummary` contract                        |
| CSV          | `papaparse`                                      | 5.7.1   | Columns read by index                         |
| Worker RPC   | `comlink`                                        | 4.4.2   | Typed worker API                              |
| Animation    | `motion`                                         | 14.14.0 | Respects `prefers-reduced-motion`             |
| Fonts        | `@fontsource/anton`, `/inter`, `/jetbrains-mono` | 5.3.0   | Self-hosted, no Google Fonts request          |

### Why TypeScript is pinned to 6.0.3 and not 7.x

`typescript` 7.0.2 is the `latest` tag, but every stable `typescript-eslint` (8.73.0 today) declares a peer range of `>=4.8.4 <6.1.0`. Installing 7.x leaves the type-aware lint layer broken, and `pnpm check` is a hard acceptance criterion. Moving to TS 7 means waiting for a `typescript-eslint` major that supports it, then updating this note.
