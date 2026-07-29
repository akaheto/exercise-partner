# Changelog

All notable changes to this project are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Epic P (started): a restricted `/my-profile` route — the current profile's
  own card, training-level/goal editor and delete section, with no
  "All profiles" switcher and no "Add a profile" form. Redirects to `/` when
  no profile is active rather than offering creation. Added to navigation as
  a 6th destination alongside the existing `/profile`, which for now still
  shows everyone the full switcher and creation form; the intent (not yet
  built — see PROJECT_PLAN.docx assumption 51) is for `/my-profile` to
  eventually replace `/profile` in navigation for non-administrator users,
  once there's a real answer for what "administrator" means at the profile
  level, which doesn't exist in the data model today. `CurrentProfileCard`
  extracted as a shared component so both routes render the identical card
  from one source; `initials()` moved to `src/lib/utils.ts`, removing one of
  its three prior duplicates.
- Epic O: the 1,218 supplied anatomical muscle-diagram renders, uploaded to a
  new public Vercel Blob store (`exercise-partner-images`) at
  `muscle-diagrams/<exercise_id>.webp` — a deterministic pathname, so no
  per-exercise database column is needed to link an exercise to its image.
  `scripts/upload-muscle-diagrams.ts` re-derives the exact filename→exercise
  mapping verified ahead of the epic (1,218/1,218, zero unmatched), refuses to
  proceed on any mismatch, and verifies the result against the live store
  afterward (paginated — the first run's un-paginated check under-reported by
  218 and looked like a real failure; it was `list()`'s 1000-item page cap).
  New `MuscleDiagramPhoto` component **replaces** the hand-built `MuscleDiagram`
  on the exercise detail page (initially shipped alongside it, then swapped in
  fully by request once coverage was confirmed complete) — a plain framed
  plate, no heading or caption. `MuscleDiagram` itself is kept, unchanged, in
  Workout Mode, where a full photographic plate would compete for space a
  mid-set screen needs for logging; that usage is what keeps the style
  guide's teal involvement ramp meaningful even though this page no longer
  uses it. Alt text is built from `primary_muscle`/`secondary_muscles` in the
  database, never from the image's own baked-in (and screen-reader-invisible)
  legend. Now the only muscle-visual on this page, so a failed image load
  shows a compact "Image unavailable" state instead of silently disappearing.
  6 unit tests, mutation-checked.
- `profiles.pin_salt`, `pin_failed_attempts`, `pin_locked_until` (migration
  0008). `generatePinSalt()` produces a genuinely random per-profile salt;
  `nextPinAttemptState()`/`isPinLocked()` lock deletion out for 15 minutes
  after 5 consecutive wrong guesses.
- `profiles.onboarding_completed_at` (migration 0007), nullable, stamped only
  when the onboarding flow's step 4 is confirmed. Distinct from
  `experience_level`/`training_goal` on purpose: those default to
  `Beginner`/`General`, so their presence alone can't tell a real choice from
  a profile that never finished onboarding — which was the entire cause of
  the redirect bug below.
- Design system on onboarding, home and the remaining surfaces (Epic N8).
  Violations 90 → **0**: the ratchet baseline is now zero on every rule, so any
  new raw palette colour, off-scale text size, half-step spacing, stray shadow,
  off-scale radius or gradient fails `npm run lint`. New `OptionCard` primitive
  for the large icon-plus-description choices in onboarding steps 2 and 3;
  `Field`, `Callout` and `EmptyState` adopted across the home profile selector,
  the login form and onboarding step 1. The progress rail gained a text
  "Step N of 4" so progress is not conveyed by colour and position alone, with
  the dots marked decorative.
- Design system on the profile and admin surfaces (Epic N7). Violations
  209 → 90, tests 263 → 273. Both destructive flows moved onto the
  `ConfirmDialog` primitive — `/profile`'s PIN confirmation had been a
  hand-rolled expanding panel and the admin table's an inline three-button
  row, and neither kept the failure reason visible on a rejected action the
  way the primitive does. The admin table moved onto `DataTable` with mono
  tabular counts, its tiles onto `Stat`, its empty case onto `EmptyState`.
  `profile-editor`'s level and goal pickers were unlabelled `div`s of buttons
  with no radio semantics and a sub-44px target; they are now a real
  `radiogroup` with `aria-checked` and a 44px floor.
- Design system adoption, phases 0–6 (Epic N). `globals.css` rebuilt on a
  four-role model per semantic colour — fill, on-fill text, on-surface text,
  tinted surface, tinted border. The missing tinted-surface role was the
  structural reason 49 hardcoded colours had accumulated: there was no token
  for "a faint success-coloured panel", so screens invented one each time.
  Ten new primitives (`page-header`, `field`, `callout`, `empty-state`,
  `error-state`, `data-table`, `stat`, `confirm-dialog`, `number-stepper`,
  `skeletons`); `Button` gains `destructive-quiet`, a 56px `workout` size and
  a `loading` prop. `scripts/check-design-tokens.ts` is wired into
  `npm run lint` as a ratchet baselined at 487 violations, so no phase can
  regress an earlier one — currently 209, with the profile, admin, onboarding
  and home surfaces still to convert.
- `NumberStepper` in Workout Mode: a 56px field flanked by 56px +/- buttons
  stepping by the plate increment for the active unit (2.5 kg / 5 lb), still
  accepting direct typing. The style guide had required large +/- targets for
  mid-workout numeric entry since Epic A; nothing had implemented it.
- Content curation (Epic L1). 1,216 of 1,218 exercises had their placeholder
  "Varies / Not specified" instructions and starting positions replaced with
  real sourced content from muscleandstrength.com, via a rate-limited
  (1/sec), locally-cached, transactionally-batched scraper tracked per
  exercise in a new `curation_status` table. The run finished 99.84% in about
  45 minutes with no manual intervention; 2 exercises are flagged
  `needs_review` for parser edge cases. Content is written as global
  (`profile_id = null`) rows in the existing `exercise_overrides` layer, so a
  spreadsheet re-import cannot clobber it.
- Exercise guidance (Epic L2), on a two-table pattern: `guidance_patterns`
  (15 canonical rows = 3 experience levels × 5 training goals) plus
  `exercise_guidance_overrides` (1,218 rows, one per exercise, FK to a
  pattern plus optional per-exercise regressions, equipment alternatives,
  mobility and contraindication flags, and form cues). This replaced an
  abandoned single-table design that would have needed 18,270 rows to say the
  same thing; changing guidance for a level/goal combination is now a
  one-row update. See `docs/GUIDANCE_ARCHITECTURE.md`.
- Onboarding, profiles and admin (Epic M). A four-step onboarding flow
  (name → experience level → training goal → completion) writes
  `experience_level` and `training_goal` onto the profile, which then select
  which guidance pattern each exercise page shows. Home gains a profile
  selector and creation; `/profile` gains an editor and a delete section.
  Profile deletion is gated by a 4–6 digit PIN hashed with PBKDF2-SHA256 at
  100k iterations. An `/admin` dashboard lists every profile with stats and
  can delete one bypassing its PIN.
- Personal records panel and weekly volume charts on `/history`.
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

- `MuscleDiagram`'s SVG `<title>` elements passed two JSX children
  (`{region.muscle}{role...}`) where React 19 requires exactly one — a real,
  previously-dormant bug, found while verifying Epic O rather than caused by
  it, but only actually fired once a client component (`MuscleDiagramPhoto`)
  was added next to it on the same page: the whole tree was silently
  regenerated on the client on every exercise-detail page load, with 38
  repeated console errors. Fixed with a single template-string child.
- **Onboarding steps 2-4 were unreachable from Epic M1's original ship until
  29 July 2026.** `createProfile()` calls `revalidatePath("/", "layout")`,
  which re-ran `/onboarding`'s server component; it redirected to
  `/exercises` the instant an active profile existed, and step 1 had just
  created one. A new user completed step 1 and landed straight in the
  exercise library, never choosing an experience level or training goal —
  both silently kept their defaults. A second, independent bug was masked by
  the first the whole time: steps 2-3 only ever set local React state, so
  even a user who somehow reached step 4 would not have had their choices
  saved. Fixed together: migration 0007 adds `profiles.onboarding_completed_at`
  (nullable — distinct from `experience_level`/`training_goal`, which can't
  tell "chose Beginner" from "never asked"), and a new `completeOnboarding()`
  Server Action writes `experience_level`, `training_goal` and the completion
  timestamp together when step 4 is confirmed. `/onboarding`'s guard now
  checks completion, not mere existence. `/` had the identical redirect bug
  independently and is fixed the same way, sending an incomplete profile back
  to `/onboarding` instead of `/exercises`. Verified against the real
  database: `e2e/n8-screenshots.spec.ts` now drives all four steps for real
  and queries `profiles` afterward rather than stopping at "the button
  navigated". 6 new unit tests on `OnboardingFlow`, two of them unhappy paths
  (the save rejecting, and the save throwing), with a mutation check
  confirming the rejection test actually fails when the check is removed.
  Known limitation, by design: revisiting `/onboarding` before step 4
  restarts the flow rather than resuming it.
- **`npm run db:generate` is fixed — two layered bugs, not one.**
  `drizzle.config.ts` loaded env with plain `dotenv/config` (`.env` only —
  local Postgres), the same bug class already fixed for runtime scripts in
  `1396bd1` but never applied to the config file `drizzle-kit` itself reads;
  now imports `scripts/load-env`. That alone did not fix it: `drizzle-kit`'s
  own snapshot history had stopped at migration 0004, and 0005–0007
  (hand-written) never got matching snapshots, so diffing today's schema
  against the stale 0004 snapshot looked exactly like renaming the abandoned
  `exercise_guidance` table into `exercise_guidance_overrides`/
  `guidance_patterns` — an ambiguity `drizzle-kit` can only resolve
  interactively. Repaired by installing a correct `0007_snapshot.json`
  generated from an empty-history run of the current schema (nothing to
  mistake for a rename), chained via `prevId` to the real `0004` snapshot.
  The already-applied migration SQL history (0000–0007) is untouched — this
  only repairs `drizzle-kit`'s own bookkeeping. Verified three ways: a clean
  `db:generate` now reports "No schema changes, nothing to migrate"; a
  throwaway test column produced exactly one correct `ALTER TABLE` line
  before being reverted; nothing was applied to the database in the repair
  itself.
- `/onboarding` failed to render at all: the page is a Server Component and
  passed an `onComplete` function to the `OnboardingFlow` Client Component,
  which throws "Event handlers cannot be passed to Client Component props".
  The flow now owns its own completion navigation.
- The onboarding progress rail drew incomplete steps and connectors in
  `bg-muted` while the page ground had just moved from a gradient to a flat
  `bg-muted`, so steps 3 and 4 rendered as bare numerals with no circle and the
  connectors between them were invisible. Second time in this epic that
  flattening a gradient made a same-coloured element vanish, and not something
  a token check can catch — both classes were legal.
- `cn()` silently dropped every named type-scale class. `tailwind-merge` only
  treats t-shirt sizes as font sizes, so `text-caption`, `text-body` and the
  rest fell into its text-*colour* group: `cn("text-caption",
  "text-muted-foreground")` discarded `text-caption` entirely. Every `Field`
  label had been rendering at the inherited size, and `buttonVariants` lost
  `text-primary-foreground` to `text-body`, leaving teal buttons with
  unstyled labels. The scale is now registered under `font-size`. App-wide,
  and invisible to every test that existed.
- White-on-primary was 3.74:1 and failed WCAG AA, despite
  VISUAL_STYLE_GUIDE.docx claiming compliance. Primary darkened teal-600 →
  teal-700 (5.47:1); teal-600 demoted to hover, teal-800 to pressed.
  `muted-foreground` darkened to `#5f6d82` (4.34:1 → 4.80:1). The dark theme
  now has its own values rather than the light hex values copied verbatim.
- `getActiveProfileId()` returned the raw cookie without checking the profile
  still existed, and around 20 call sites branch on it. A cookie outliving
  its profile made the app believe a deleted profile was active: `/onboarding`
  redirected away, `/profile` rendered "no profile selected" so the delete
  section never appeared, and profile-scoped queries returned empty instead
  of erroring. Now returns null when the profile is gone.
- Migrations 0005 and 0006 had SQL files but no journal entries, so Drizzle
  had never run them. Both registered and made idempotent.
- Scripts loaded only `.env` (local Postgres) while Next.js loads `.env.local`
  (Neon), so script writes went to a different database than the app read
  from. Added `scripts/load-env.ts` matching Next.js precedence. The same
  mismatch in `playwright.config.ts` had caused a failed e2e run to orphan a
  throwaway profile in the production database.
- Two layout bugs found in a browser, not by tests: 44px controls no longer
  fit beside the exercise name, collapsing the builder's `flex-1 min-w-0` name
  box to zero so its children painted over the inputs; and `block-list`'s
  `flex-1` div defaulted to `min-width: auto`, so a long exercise name pushed
  a card to 527px inside a 375px viewport. Both now guarded by tests.
- Recharts falls back to its own `#666`/`#ccc` defaults when an inline `fill`
  does not resolve, so axis ticks and cursors are now set with Tailwind
  classes rather than inline `var()` strings. Chart styling extracted to
  `chart-theme.ts`.
- Instruction formatting: numbered steps were being flattened, and
  snake_case database fields were mismatched against camelCase override keys.
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

### Changed

- The admin dashboard's green "✓ Secure Connection — protected by two-factor
  authentication" panel and the admin login's security note were rewritten
  rather than restyled during N7. Both asserted a protection that does not
  exist; converting them to the `Callout` primitive while keeping the words
  would have preserved a false claim in a nicer box. Both now state that the
  session cookie is unsigned and the gate is bypassable.

### Security

- **Fixed: profile PINs shared one hardcoded salt and had no attempt
  limiting.** Identical PINs used to produce identical `pin_hash` values —
  anyone with database read access could see which profiles shared a PIN, and
  one precomputed table covered every profile's 4-6 digit keyspace at once.
  `generatePinSalt()` now produces a genuinely random salt per profile, stored
  in the new `pin_salt` column. Existing profiles' `pin_hash` — computed under
  the old fixed salt — keeps verifying via an explicit backfill of that same
  salt onto their row in migration 0008, rather than a forced reset with no
  reset UI to support it; a regression test pins `hashPin`'s output for a
  known input under the legacy salt so this compatibility can't silently
  break later. Verified directly against the database: two throwaway profiles
  created with the identical PIN produce different `pin_hash` values. Attempt
  limiting: 5 consecutive wrong guesses now lock deletion out for 15 minutes
  (`pin_failed_attempts`/`pin_locked_until`, checked before a guess is even
  hashed), verified live end-to-end — a 6th attempt with the *correct* PIN is
  still refused while locked. `verifyPin` compares with
  `crypto.timingSafeEqual` rather than `===`.
- **Fixed: the admin session cookie was unsigned and forgeable.** Its value
  was the literal string `"authenticated"`, so setting one cookie by hand
  granted full admin access — including deleting any profile and all of its
  training history — with `ADMIN_TOKEN` bypassed entirely. The same check also
  guarded `deleteProfileAsAdmin`, the Server Action that performs the
  deletion; Server Actions are reachable by direct request regardless of which
  page rendered the button, so the page's guard never protected it.
  `src/lib/admin-auth.ts` now signs the session with HMAC-SHA256 over
  `SESSION_SECRET`, the pattern `src/lib/auth.ts` has used since Epic C, under
  a distinct message so a site token cannot be replayed as an admin one. The
  4-hour expiry moved inside the signed payload, so it is enforced by the
  server rather than by a cookie `maxAge` the client is free to ignore. The
  Server Action now verifies the session itself. Covered by 15 unit tests and
  4 Playwright tests, the first of which replays the original attack and
  asserts it now lands on the login page.
- **Fixed: the gate now fails closed.** `SITE_PASSWORD` and `ADMIN_TOKEN` fell
  back to `"change-me"` and `"change-me-in-production"` when unset — and
  `ADMIN_TOKEN` was in fact unset on this project, making the second secret a
  constant published in this repository. All three secrets are now required,
  and a missing one yields a configuration error instead of an admitted
  request, matching `src/proxy.ts`. Both are compared in constant time, and a
  wrong password and a wrong token return the same message so the response
  cannot be used to determine which half was right.
  **`ADMIN_TOKEN` must now be set** — `/admin` reports a configuration error
  until it is. See `.env.example`.
- Still open: profile PINs use a single hardcoded salt
  (`"exercise-partner-salt"`) shared by every profile, so identical PINs
  produce identical hashes. Anyone with database read access can see which
  profiles share a PIN, and one precomputed table covers the entire 4–6 digit
  keyspace. There is no attempt limiting, so a 4-digit PIN is exhaustible in
  10,000 requests, and `verifyPin` compares with `===` rather than
  constant-time.
- Profile PINs use a single hardcoded salt (`"exercise-partner-salt"`) shared
  by every profile, so identical PINs produce identical hashes: anyone with
  database read access can see which profiles share a PIN, and one
  precomputed table covers the entire 4–6 digit keyspace. There is no attempt
  limiting, so a 4-digit PIN is exhaustible in 10,000 requests, and
  `verifyPin` compares with `===` rather than constant-time.

### Notes

- Creating the Vercel Blob store (`vercel blob create-store`, for Epic O)
  triggered an implicit env pull that overwrote `.env.local` with only the
  project's "Development"-scoped cloud variables. On investigation nothing
  was actually lost — `SITE_PASSWORD` and `SESSION_SECRET` have only ever
  lived in the separate, untouched `.env` file, and all three secrets already
  exist in Vercel's Preview/Production scope, just not "Development" — but
  worth knowing: any future command that triggers an env pull will silently
  overwrite `.env.local` with whatever is currently scoped to Development,
  dropping anything hand-added there that isn't also registered on Vercel's
  side. Local dev was confirmed intact afterward by running the admin-auth
  e2e spec end to end.
- Three `.sql` files sit directly in `drizzle/` (`0002_curation_tracking`,
  `0003_remove_breathing_movement_pattern`, `0004_exercise_experience_guidance`)
  rather than in `drizzle/migrations/`, and are absent from the journal.
  Drizzle never runs them, and their indices collide with real migrations of
  the same number. They should be deleted or archived.
- Exercise-specific tips and common mistakes were hand-written for 20
  representative exercises only; the other ~1,198 fall back to their guidance
  pattern's generic cue. Deliberately partial rather than fabricated.
- Guidance pattern routing currently assigns every exercise a `beginner_*`
  pattern based on movement type, so 10 of the 15 patterns are reachable only
  once a profile's own experience level selects them at read time.
- The `profiles` schema comment still reads "Lightweight — no credentials",
  which stopped being true when `pin_hash` was added.
- 1,218 rendered muscle diagrams (133 MB of `.webp`, ~110 KB each) were
  supplied on 29 July 2026 for the epic after the design system work.
  Filenames map 1:1 onto exercise names — verified zero unmatched, zero
  ambiguous, zero duplicates. They carry three problems worth deciding before
  integration: text baked into the raster (so alt text must come from the
  database), an orange/navy involvement palette that contradicts the style
  guide's teal ramp and cannot be re-themed, and an opaque white card that
  will not sit well in the dark theme.
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
