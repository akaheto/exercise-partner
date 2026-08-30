---
name: code-audit
description: Runs this project's quality gate — lint (ESLint + the design-token ratchet), typecheck, and unit tests (vitest) — via one bundled script, reporting terse pass/fail with file:line detail. Pass "e2e" or "all" to also run Playwright. Use before marking any coding task done.
allowed-tools: Bash, Read
argument-hint: [unit|e2e|all]
---
Run `scripts/audit.sh` with an optional scope argument (`unit` — default,
`e2e`, or `all`). In order: `npm run lint` (ESLint plus the design-token
ratchet in `scripts/check-design-tokens.ts`), `npm run typecheck`,
`npm test`. Pass `e2e` or `all` to also run `npm run test:e2e`
(Playwright) — slower, and needs a dev server plus a database, so it's
excluded from the default run. Stops and reports at the first failing
stage — fix and re-run narrower first rather than letting every stage
fail in sequence.

Report format:
- **Stage**: which stage failed (or "all clean")
- **Findings**: terse `file:line` list, not full command output pasted
  wholesale — summarize, don't dump
- **Next step**: what to fix, in priority order if more than one issue

If everything passes, say so in one line — don't pad a clean result with
narrative.
