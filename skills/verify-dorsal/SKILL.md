---
name: verify-dorsal
description: Drive the real Dorsal app with Playwright and collect evidence (screenshots, console, network). Use before reporting any UI work done, or to reproduce a bug a user reported.
---

# Verify Dorsal

Verification means operating the app the way a user does and looking at what actually happened. Reading the code and assuming is not verification.

## When to use it

- Before saying a UI change is done.
- Before touching code for a reported bug, to reproduce it.
- After a change, to confirm the bug is gone.

## Commands

```bash
pnpm verify                          # mobile+desktop, light+dark, screenshots of the three routes
pnpm verify --viewport mobile        # 390x844 only
pnpm verify --viewport desktop       # 1440x900 only
pnpm verify --theme dark             # one colour scheme only
```

The runner starts Vite on `127.0.0.1:5173` if nothing is listening there, and closes it afterwards. Every run writes a new folder:

```
artifacts/verify/<timestamp>/
├── screens/      landing|upload|result-<viewport>-<theme>.png, full page
├── console.log   main thread console + page errors
├── network.json  every request, with the screen that produced it
└── summary.json  options, screenshot list, counts
```

Exit code 1 means a `console.error`, a `pageerror` or a console warning appeared. Treat it as a failure even when the screenshots look right.

## Reading the evidence

1. Open the screenshots for the viewport and theme you changed. A change is not verified at one size only: the product is mobile first, so mobile is the primary view and desktop must not regress.
2. Check `console.log` first when something is blank in a screenshot.
3. Check `network.json` for any request that is not a same-origin static asset. Dorsal must make zero third-party requests at all times, and after the user selects a file it must make none at all.
4. Report what you observed, with the file path. Do not describe an intention.

## Not available yet

`--fixture`, `--trace`, `--perf` and `--heap` belong to the same contract (`AGENTS.md` section 2) but are not implemented: `--fixture` needs the upload flow from H-06, and the trace, performance and heap capture land with H-12. The runner refuses those flags explicitly instead of silently ignoring them.

## End-to-end tests

```bash
pnpm test:e2e            # Chromium, projects: mobile and desktop
pnpm test:e2e -- --ui    # interactive
```

`e2e/` holds the acceptance suite: routing, theme persistence and an axe scan that fails on serious or critical accessibility violations. Fixtures from `fixtures/generator/` join it in H-01 and H-06.

## Never

- Never verify against a real person's `activities.csv`. Use fixture personas; the repo rejects committed CSV and ZIP files.
- Never mark a task done from a screenshot alone if the console or network log shows a problem.
