# Exercise Partner — working rules

A personal exercise knowledge base and workout platform, seeded from a
1,218-exercise spreadsheet, for a small group of people behind a shared password.

## Where things are

- **Code** — this repository (`~/Code/exercise-partner`)
- **Docs and source spreadsheet** — the synced Drive folder:
  `~/Library/CloudStorage/GoogleDrive-akaheto@gmail.com/My Drive/Claude/Code/Exercise Partner/`

Read `PROJECT_PLAN.docx` for current status, and `TECHNICAL_SPEC.docx` plus
`VISUAL_STYLE_GUIDE.docx` for decisions already made. Apply those decisions rather
than re-deciding them per feature.

## Active work

`docs/technical/qa-audit-2026-08-31.md` was a prioritized QA backlog
(UX/a11y, frontend perf, backend reliability/data/security, structural) —
all 14 numbered items are now resolved, fixed, or found already resolved
(2026-09-01). Read it for context on what was found and fixed, but there's
nothing actionable left in it; it's a closed record now, not an open
backlog. `CHANGELOG.md` has the full detail on every fix. Two threads live
on outside it: item 55's broader auth-architecture question, and
PROJECT_PLAN.docx item 57's suggestion (not built) to unify
`enhancements.json` with `ENHANCEMENTS.docx`.

## Commands

```
npm run dev          npm run lint        npm test
npm run build        npm run typecheck   npm run test:watch
npm run docs         # regenerate the Word deliverables into the Drive folder
```

Run `lint`, `typecheck` and `test` before reporting anything complete, and report
their real output — never assumed output.

## Architectural rules

1. **Imported and app-owned data never share a table.** The spreadsheet import
   rebuilds source tables on every run; it must never be able to damage user data.
   User corrections live in a sparse override layer merged over source at read time.
2. **Judgement logic is pure.** The workout generator, duration estimation,
   substitution ranking and volume math live in `src/domain` as pure functions with
   no I/O, so they are testable without a database or browser.
3. **History is immutable.** Sessions snapshot the workout as it was at start time,
   and logged sets reference `exercise_id` directly, so editing a template later
   never rewrites what was actually performed.
4. **Never present derived data as sourced fact.** Much of the spreadsheet is
   rule-derived and unreviewed; muscle diagrams and substitutions are inferred. Label
   them. Overstating confidence in a training context is a safety issue.

## Workflow

- Write a short plan before implementing anything new; wait for approval unless told
  to proceed.
- Build one deliverable at a time. After each, update its status and add a Changelog
  line in `PROJECT_PLAN.docx` (regenerate via `npm run docs`) — don't wait to be asked.
- Log enhancement ideas in `ENHANCEMENTS.docx` as soon as they come up, even if not
  built.
- Don't add unrequested scope — flag it as a suggestion instead.
- Stop and check in at the end of each epic.
- Write tests alongside each feature, including at least one unhappy path.
- Record ambiguities as explicit assumptions in `PROJECT_PLAN.docx` section 4, not
  just in chat.

## Model tiering

Foundation decisions (data model, architecture, the generator algorithm, the style
guide) belong on the strongest model. Applying decisions already made — routine
features, tests for defined cases, refactors, filling in docs — is fine on a lighter
model. Rule of thumb: making a choice → strong model; applying one → light model.

## Style

Follow `VISUAL_STYLE_GUIDE.docx` for palette, typography, spacing, component patterns
and UI copy voice. Key points: one teal accent, Geist Mono for numerics, 44px minimum
touch targets (56px in Workout Mode), designed empty/loading/error states, and copy
that is direct without hype or shame.
