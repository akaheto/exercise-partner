# Changelog

All notable changes to this project are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Intelligence Foundation (Epic J) — substrate for future intelligence
  features, not the features themselves. `src/domain/training-metrics.ts`:
  volume per primary muscle group per week per profile, joining
  `session_sets` through `exercise_muscles` (primary role only, so a
  compound lift's volume isn't double-counted across every muscle it
  merely assists). A "Muscle balance" panel on `/history` ranks that volume
  over the last 4 weeks as a plain bar list — a read of what happened, not
  a recommendation. `src/domain/progression.ts` defines the contract a
  future "suggest next weight" feature would need
  (`ProgressionInput`/`ProgressionSuggestion`/`ProgressionStrategy`) with a
  `NOT_IMPLEMENTED_PROGRESSION_STRATEGY` that throws rather than
  fabricating a suggestion — deliberately no algorithm yet.
- Workout History (`/history`, `/history/[id]`): every session, most recent
  first, with in-progress sessions linking to Resume instead of a static
  detail view. Session detail shows every logged set per exercise, read from
  the same immutable snapshot Workout Mode wrote. A weekly total-volume bar
  chart appears on `/history` once there's more than one week of data
  (Recharts' first real use in the app). Exercise detail pages get a "Your
  history" panel — a top-set-weight trend line plus a per-session list; the
  workout edit page gets a "Past sessions" panel scoped to that specific
  template. All aggregation (volume, weekly bucketing, per-session
  collapsing) is pure and unit-tested
  (`src/domain/session-history.ts`, 15 tests) rather than computed inline in
  a page.
- History export (`/history/export/csv`, `/history/export/json`): the
  complete one-row-per-set history — every session regardless of status, not
  a summary — as a real file download (`Content-Disposition: attachment`).
  CSV rendering is pure and unit-tested for quoting/escaping edge cases
  (`src/domain/export.ts`, 6 tests).
- Workout Mode (`/session/[id]`): a full-screen, nav-free guided runner
  (`src/app/session/`) that snapshots the workout into `sessions.workoutSnapshot`
  at start — a one-time jsonb copy, so a later template edit can never change
  what a session displays. Steps through one exercise at a time, reusing the
  Exercise Library's video embed, instructions and muscle diagram. Logging a
  set (56px weight/reps inputs, one tap) writes a `session_sets` row, with an
  Undo for mis-taps. Session progress (current exercise/set) is derived from
  the sets already logged rather than a stored cursor
  (`src/domain/session-flow.ts`, `computeSessionProgress`, 10 unit tests) —
  verified that reloading mid-session, which discards all client state,
  resumes at the exact next set. Rest timer between sets is wall-clock based
  (`Date.now()` diffing, not a decrementing counter) so it stays accurate even
  if the tab is backgrounded, with a Skip control. Finishing marks the session
  completed; the exit ("X") control requires an explicit confirm dialog before
  abandoning. "Start" entry points added to the workout edit page and workout
  cards.
- Playwright, installed for the first time (`e2e/`, `playwright.config.ts`):
  a full Workout Mode run-through (login → build a workout → run it,
  including a real page reload to prove resume → finish it → abandon a
  second session) against a dedicated dev server on port 3100 so it never
  collides with a manually-running one. Cleans up its own test data —
  `npm run test:e2e`.
- Workout Library (`/workouts`), replacing the Epic A-era placeholder: every
  saved workout as a card with name search (debounced, URL-driven) and an
  archived/active toggle, exercise count and estimated duration computed the
  same way the builder does (`listWorkoutSummaries`), one-click duplicate
  that deep-copies blocks and items into fully independent rows inside a
  transaction (verified at the database level, not just visually, that the
  copy's rows are distinct from the original's), and archive/restore via the
  existing `archivedAt` column. Versioning and tags/folders are deliberately
  deferred rather than skipped silently — see PROJECT_PLAN.docx section 4,
  assumptions #28-29.
- Multi-select exercise cards (`/exercises`): a checkbox overlay on every
  card, a persistent selection tray (survives filter/pagination navigation —
  the selection provider lives at the (app) layout level, not the page, so
  Next.js guarantees it isn't remounted) showing a live duration tally, and
  a one-click "Add to workout" that seeds a new workout in selection order.
  The tally uses a quick-preview model (`estimateSelectionMinutes`): default
  3-set prescription with a flat 1-minute transition between exercises
  instead of a rest-based calculation, since nothing's been configured yet.
- Deterministic workout assessment (shown on the builder once a workout has
  exercises): which muscles it trains — primary and secondary, most-frequent
  first — which of the three body regions it doesn't touch, a weight-
  selection tip inferred from the rep ranges actually prescribed (not a
  fixed label — changes if you edit the reps), and a recovery tip based on
  which muscle groups dominate (`src/domain/workout-assessment.ts`, 16
  tests). Rule-based, no AI call — see ENHANCEMENTS.docx for an AI-powered
  version logged as a deferred idea.
- Intelligent Workout Generator (`/build/generate`): a 5-step questionnaire
  (goal, duration, focus, experience, equipment) feeds a pure, unit-tested
  selection algorithm (`src/domain/generator/`, 15 tests) — one compound
  anchor exercise per relevant movement pattern first, then diverse
  accessory work, compound-first ordering, and a duration-fit loop that
  reuses the Workout Builder's own duration estimator. Equipment answers
  save as a full profile snapshot to `equipment_inventory`. Generated
  workouts seed a real workout and redirect straight into the existing
  builder, so review/substitute/save needed no new UI.
- Manual Workout Builder (`/build`, `/workouts/[id]/edit`): add exercises from
  a search picker as a new block or grouped into an existing one (auto-
  promoting it to a superset), drag-and-drop block reordering (`dnd-kit`,
  keyboard-accessible), per-item prescription (sets/reps range/rest/notes,
  auto-save on blur), per-block rest with a Superset/Circuit label toggle,
  removing an item (auto-reverting a block to "single" at one item left), and
  inline substitution reusing the Exercise Library's candidate data.
- Live estimated workout duration (`src/domain/workout-duration.ts`, 8 unit
  tests) — recalculates after every add/remove/reorder/prescription change.
- `ON DELETE` cascade/set-null rules across the app-owned schema (migration
  `0001_reflective_titanium_man.sql`) — see Fixed below.
- Exercise Library (`/exercises`): search, 8 filter dimensions (muscle,
  equipment, type, mechanics, force, experience level, body region, video
  availability — muscle/equipment filters match secondary muscles too, via
  `IN (SELECT ...)` subqueries), 5 sort orders, and card/table views, all
  driven by a parseable/shareable URL query string (`src/domain/exercise-filters.ts`,
  18 unit tests).
- Exercise detail page (`/exercises/[id]`): instructions/tips/common mistakes
  rendered as bullets from the source's prose (`src/domain/text.ts`,
  sentence-splitting), video embed with YouTube + Vimeo support and a
  source-link fallback for anything else, and both relationship types —
  rule-derived substitutions (`source_relationships`) and human-curated
  variation/alternative/progression/regression links (`exercise_links`).
- Custom SVG muscle diagram (`src/components/exercise/muscle-diagram.tsx`):
  front + back simplified body map, all 23 canonical muscles mapped to
  regions, explicitly labelled as a derived/approximate diagram, not source
  data (one muscle, Plantar Fascia, has no visual mapping and is called out
  in text instead of silently dropped).
- A styled 404 for exercise ids that don't resolve, matching the app's design
  system instead of Next's generic default.
- App shell: responsive top bar (desktop) / bottom tab bar (mobile) across five
  nav destinations, light/dark theme with no flash of unstyled content
  (`src/lib/theme.ts` + `useSyncExternalStore`-based toggle).
- VISUAL_STYLE_GUIDE.docx's teal palette applied to `globals.css` theme tokens,
  replacing shadcn's generic grey defaults; added `success`/`warning`/`info` as
  first-class Tailwind color utilities.
- Password gate on Next.js 16's Proxy convention (`src/proxy.ts`): HMAC-SHA256
  session cookie via Web Crypto (portable across runtimes), constant-time
  password comparison, `next` param round-trips back to the originally
  requested page after login.
- `requireSiteSession()` (`src/lib/require-site-session.ts`): every Server
  Action that writes app data verifies the session itself, independent of
  Proxy — per Next's own guidance that a route refactor can silently drop
  Proxy coverage without affecting Server Actions on that route.
- Profile switcher: a top-bar dialog and a full `/profile` page — create, list,
  switch, and a per-profile weight-unit preference. Verified in a real browser
  that switching profiles correctly isolates each profile's data.
- Drizzle schema for the full two-layer data model: source layer
  (`source_exercises`, `source_equipment`, `source_muscles`, `source_relationships`),
  derived layer (`exercise_muscles`, `exercise_equipment`, `exercise_links`), and
  app layer (`profiles`, `exercise_overrides`, `equipment_inventory`, `workouts`,
  `workout_blocks`, `workout_items`, `sessions`, `session_sets`) — 15 tables total.
- Idempotent import pipeline (`npm run import:exercises`) that reads the source
  spreadsheet via exceljs, upserts source data by natural key with hash-based
  change detection, and fully rebuilds the derived/relationship tables each run.
- Pure, unit-tested parsing helpers (`src/domain/importParsing.ts`) for the
  spreadsheet's Yes/No, comma-list, and `"label | url; ..."` conventions.
- Merged read model (`src/domain/mergeOverrides.ts` + `src/db/queries/exercises.ts`)
  layering per-field user corrections over source data at read time.
- Data-quality report (`npm run db:report`): row counts and a sparse-field audit.
- Local Postgres 16 (Homebrew) provisioned for development; migrations via
  `npm run db:generate` / `npm run db:migrate`.
- Next.js 16 scaffold (App Router, TypeScript, Tailwind CSS 4, ESLint).
- shadcn/ui initialised with Base UI primitives and Geist Sans/Mono.
- Core dependencies: Drizzle ORM with the `postgres` driver, Zod 4, dnd-kit,
  Recharts, lucide-react.
- Vitest with Testing Library and a jsdom environment; `cn` utility covered by
  unit tests including empty and falsy input cases.
- `npm run typecheck`, `npm test`, `npm run test:watch` and `npm run docs` scripts.
- Word deliverable generators in `scripts/docs/` producing `PROJECT_PLAN.docx`,
  `TECHNICAL_SPEC.docx`, `VISUAL_STYLE_GUIDE.docx`, `USER_GUIDE.docx` and
  `ENHANCEMENTS.docx` into the synced Drive project folder.
- Source spreadsheet vendored to `data/source/` so imports are reproducible.

### Fixed

- The spreadsheet's `"Not listed"` sentinel was being stored as literal text
  instead of SQL `NULL`, silently breaking `is not null` queries downstream.
  Normalised at import time.
- `--font-sans` in `globals.css` was self-referential (`var(--font-sans)`), so
  the app was silently falling back to system fonts instead of Geist Sans.
- shadcn's default `Button`/`Input` heights (32px) fell short of the style
  guide's 44px touch-target minimum; bumped the whole size scale.
- The no-flash theme script triggered a real React 19 warning ("script tag
  while rendering") as a raw JSX `<script>` child; moved to `next/script`'s
  `beforeInteractive` strategy, Next's sanctioned mechanism for this.
- The original schema (Epic B) had no `ON DELETE` behaviour on any foreign
  key, discovered when a workout-deletion test failed with a constraint
  violation. Added cascade rules across the app-owned tables, and set-null on
  `sessions.workoutId` specifically so deleting a workout template never
  deletes the history recorded against it.

### Notes

- The repository lives at `~/Code/exercise-partner`, deliberately outside Google
  Drive, so dependency and build output are not continuously synced.
- Playwright end-to-end testing is deferred to Epic H, when Workout Mode provides a
  flow worth testing end to end.
- 27 `npm audit` advisories, all in transitive dependencies of dev/build
  tooling, none in exercised application code paths; see README.
- exceljs was chosen over xlsx/SheetJS for reading the spreadsheet: exceljs's
  advisories are in an unused zip-writer path, while xlsx has unpatched CVEs
  directly in its read path.
- One muscle name in the source data ("Middle Back") isn't in the original
  Muscle Taxonomy sheet; the import pipeline auto-extends the taxonomy rather
  than dropping the data.
- `middleware.ts` is `src/proxy.ts` here — Next.js 16 renamed the convention
  (function `middleware` → `proxy`) and changed its default runtime to Node.js.
- A browser password-manager extension (1Password, confirmed) can inject an
  overlay into `type="password"` fields that blocks Chrome automation's
  synthetic click/type. Does not affect real users or the app itself; noted in
  PROJECT_PLAN.docx assumption #15 for future browser-based verification work.
- `next/script`'s `beforeInteractive` strategy still triggers a React 19
  dev-only console warning in this Next.js 16.2.12 build, despite being the
  framework's own recommended pattern. Confirmed dev-only (`npm run build` has
  no warnings) and functionally correct; not fixable from application code —
  see PROJECT_PLAN.docx assumption #16.
- `next/image` is configured for a single remote host
  (`cdn.muscleandstrength.com`) — the only one in the current data. A future
  additional import source would need its host added to `next.config.ts`.
