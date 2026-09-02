import {
  STATUS as S,
  bullet,
  buildDocument,
  callout,
  footer,
  formatDate,
  h1,
  h2,
  p,
  rich,
  spacer,
  subtitle,
  table,
  title,
  writeDocx,
} from "./shared";

const EPIC_COLS = ["#", "Deliverable", "Status", "Notes"];
const EPIC_WIDTHS = [7, 48, 10, 35];

export async function generateProjectPlan() {
  const doc = buildDocument([
    title("Project Plan — Exercise Partner"),
    subtitle(
      `Last updated: ${formatDate()}   ·   Status legend: ${S.notStarted} Not Started · ${S.inProgress} In Progress · ${S.done} Done · ${S.blocked} Blocked`,
    ),

    h1("1. Project Summary"),
    rich(
      "**Exercise Partner** is a personal exercise knowledge base and workout platform. It turns a 1,218-exercise research spreadsheet into a living training system: a reference library for learning movements correctly, two ways to build workouts (manual and intelligently generated), a guided workout mode that feels like having a personal trainer, and a permanent performance history that later becomes the basis for progression recommendations.",
    ),
    h2("Who it is for"),
    p(
      "A small, known group of people — the owner plus family/friends — each with their own workouts and training history. The whole site sits behind a single shared password; inside it, a lightweight profile picker keeps each person's data separate. There are no per-person logins to manage.",
    ),
    h2("What success looks like"),
    bullet("Every exercise in the database has a genuinely useful reference page — the place you go to learn a movement, not a thin data dump."),
    bullet("Building a workout by hand is fast enough to do between sets; generating one takes under a minute of questions."),
    bullet("Workout Mode is usable one-handed on a phone, mid-set, without hunting for controls."),
    bullet("No workout data is ever lost or silently rewritten — history is immutable once recorded."),
    bullet("The spreadsheet can be re-imported at any time without destroying customisations."),
    bullet("It looks and feels like a commercial fitness product, on desktop and phone."),

    h2("Guiding constraints"),
    rich(
      "**Imported data stays separate from generated data.** The spreadsheet is the seed, not the ceiling — later phases will add exercises from other sources. Anything the app or the user creates lives in its own layer so re-imports never clobber it.",
    ),
    rich(
      "**Architected for intelligence that does not exist yet.** Progression recommendations, plateau detection, volume balancing and overtraining warnings are explicitly out of scope for v1, but the data model records what they will need from day one.",
    ),
    rich(
      "**Not all information is in the spreadsheet.** Some fields are sparse or marked \"Not listed\", and some (muscle diagrams, movement visuals) are not in it at all. These are derived or built, and are always labelled as such rather than presented as sourced fact.",
    ),

    h1("1a. Document Formats"),
    p(
      "PROJECT_PLAN, TECHNICAL_SPEC, VISUAL_STYLE_GUIDE, USER_GUIDE and ENHANCEMENTS are delivered as Word (.docx) files in the synced Google Drive project folder. README.md and CHANGELOG.md stay as markdown in the code repository, where tooling and GitHub expect them.",
    ),
    callout(
      "Note",
      "These Word files are generated from scripts in the repo (npm run docs), not hand-edited. Editing them directly in Word works, but the next generation run will overwrite those edits — raise changes in conversation instead so they are captured in the source.",
    ),

    h1("1b. Model Tiering"),
    p(
      "Foundation work — the stack, data model, generation algorithm and visual style guide — belongs on the strongest available model. Once those are settled, routine feature implementation can run on a lighter model by following TECHNICAL_SPEC.docx and VISUAL_STYLE_GUIDE.docx.",
    ),
    rich(
      "Rule of thumb: **if a choice is being made, use the strong model. If a choice already made is being applied, a lighter model is fine.**",
    ),

    h1("2. Working Agreement"),
    bullet("One deliverable at a time: implemented, tested, and verified working before moving on."),
    bullet("Status and Changelog below are updated after each deliverable automatically — no need to ask."),
    bullet("Enhancement ideas get logged in ENHANCEMENTS.docx as soon as they come up, then moved to Implemented once built."),
    bullet("Ambiguities are written into section 4 of this document as explicit assumptions, not just mentioned in chat."),
    bullet("Lint, typecheck and tests are run — and their real output reported — before anything is called done."),
    bullet("Work stops for a check-in at the end of each epic."),

    h1("3. Deliverables"),

    h2("Epic A — Project Foundation"),
    table(
      EPIC_COLS,
      [
        ["A1", "Confirm project goal, target users, and must-have features", S.done, "Confirmed: multi-person, password-gated, spreadsheet as seed database"],
        ["A2", "Recommend and confirm a tech stack", S.done, "Next.js 16 · TypeScript · Postgres/Drizzle · Tailwind 4 · shadcn/ui"],
        ["A3", "Scaffold the project", S.done, "Local repo at ~/Code/exercise-partner; Drive folder holds docs only"],
        ["A4", "Set up test runner and linter", S.done, "Vitest + Testing Library; ESLint via eslint-config-next. Playwright deferred to Epic H"],
        ["A5", "Create README.md, CHANGELOG.md, and the four Word deliverables", S.done, "Generated via npm run docs"],
        ["A6", "Baseline check: lint, typecheck and tests run clean", S.done, "All three verified green on the scaffold"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic B — Data Foundation & Import"),
    p(
      "Turns the spreadsheet into a queryable database with a clean separation between imported and app-owned data. Everything downstream depends on this being right.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["B1", "Provision Postgres and wire up Drizzle", S.done, "Local Postgres 16 via Homebrew for development; Neon deferred to first deploy"],
        ["B2", "Design and migrate the source-layer schema", S.done, "source_exercises (52 cols), source_equipment, source_muscles, source_relationships"],
        ["B3", "Design and migrate the app-layer schema", S.done, "15 tables total; profiles/workouts/sessions use uuid ids, child rows use identity ints"],
        ["B4", "Build the idempotent import pipeline", S.done, "1,218/1,218 exercises imported; re-run verified 0 added/0 changed/1,218 unchanged"],
        ["B5", "Build the merged read model", S.done, "mergeOverrides() unit tested (8 cases) + verified end-to-end against real data"],
        ["B6", "Import verification and data-quality report", S.done, "npm run db:report; see section 4 for what it found"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic C — Design System & App Shell"),
    table(
      EPIC_COLS,
      [
        ["C1", "Write VISUAL_STYLE_GUIDE.docx", S.done, "Written in Epic A5; referenced from here on rather than redone"],
        ["C2", "Build the app shell", S.done, "Top bar (desktop) + bottom tab bar (mobile), light/dark with no flash, teal palette applied to theme tokens"],
        ["C3", "Password gate and profile switcher", S.done, "Next.js 16 Proxy (renamed from Middleware); HMAC-signed cookie; profile picker with inline creation"],
        ["C4", "Core component set", S.done, "shadcn/ui components; fixed 32px default heights to the spec's 44px touch-target minimum"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic D — Exercise Library"),
    table(
      EPIC_COLS,
      [
        ["D1", "Browse, search, filter and sort", S.done, "8 filters (muscle/equipment match secondary muscles too, via IN subqueries) + debounced search + 5 sort orders"],
        ["D2", "Table and card views", S.done, "URL-driven (q, muscle, equipment, ..., view, page); verified filters compose and round-trip through the URL"],
        ["D3", "Exercise detail page", S.done, "Instructions/tips/mistakes rendered as bullets from the source's prose via sentence-splitting"],
        ["D4", "Muscle diagram component", S.done, "Front+back SVG, 23 canonical muscles mapped to simplified regions; explicit \"approximate, not source data\" disclaimer"],
        ["D5", "Media handling", S.done, "YouTube + Vimeo embeds (both confirmed present in the data); source-link fallback otherwise"],
        ["D6", "Substitutions and related exercises", S.done, "source_relationships candidates + resolved/unresolved exercise_links, both verified rendering with real data"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic E — Manual Workout Builder"),
    table(
      EPIC_COLS,
      [
        ["E1", "Add exercises from the library while building", S.done, "Name-search picker dialog (/build hub, per-block \"Add to this block\"); verified end-to-end"],
        ["E2", "Drag-and-drop reordering", S.done, "dnd-kit block reordering; verified — order persists across reload"],
        ["E3", "Per-exercise prescription", S.done, "Sets/reps range/rest/notes, auto-save on blur; verified persistence for both item and block fields"],
        ["E4", "Supersets and circuits", S.done, "Adding a 2nd exercise to a block auto-promotes it; removing down to 1 auto-reverts; Superset/Circuit label toggle"],
        ["E5", "Live estimated duration", S.done, "src/domain/workout-duration.ts, 8 unit tests; recalculates after every change, verified in browser"],
        ["E6", "Inline substitution", S.done, "Reuses Epic D's substitution candidates; verified swap preserves prescription"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic F — Intelligent Workout Generator"),
    p(
      "The highest-risk epic: it is the one place the app makes judgement calls on the user's behalf. Selection rules are written down in TECHNICAL_SPEC.docx and covered by tests.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["F1", "Questionnaire flow", S.done, "5-step wizard: goal, duration, focus, experience, equipment (saved as a full profile snapshot)"],
        ["F2", "Equipment-aware candidate filtering", S.done, "fetchCandidatePool filters by equipment; verified 5/28 selected -> persisted as 5 have/23 no"],
        ["F3", "Selection and balance engine", S.done, "One compound anchor per movement pattern first, then diverse accessories; verified real full-body run covered squat/hinge/push patterns"],
        ["F4", "Ordering and time-fitting", S.done, "Compound-first ordering; duration-fit loop reuses Epic E's estimator — verified a strength workout correctly trimmed to 3 exercises (~41 min vs 40 requested) because of its long rest"],
        ["F5", "Review, substitute and save", S.done, "Generated workouts seed a real workout row and redirect straight into Epic E's builder — full edit/substitute/save for free, no separate review UI needed"],
        ["F6", "Generator test suite", S.done, "src/domain/generator/generate.test.ts, 15 tests: pattern coverage, experience filtering, duration fitting, goal prescriptions, 3 unhappy paths, determinism"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic G — Workout Library"),
    table(
      EPIC_COLS,
      [
        ["G1", "Save, list and search workouts", S.done, "/workouts: search by name, exercise count + estimated duration per card, verified end-to-end with real data"],
        ["G2", "Duplicate, edit and archive", S.done, "Deep-copy duplicate verified independent at the DB level (separate block/item rows); archive/restore via archivedAt; edit already existed (Epic E)"],
        ["G3", "Versioning", S.notStarted, "Resolved differently than planned: Epic H's session snapshot (workoutSnapshot jsonb, captured once at session start) already protects history from later template edits, so template versioning turns out not to be needed for that purpose. Still not built — see section 4, item 30."],
        ["G4", "Organisation", S.notStarted, "Search (G1) covers the immediate need; tags/folders deferred until real usage shows whether they're needed — see PROJECT_PLAN section 4"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic H — Workout Mode"),
    table(
      EPIC_COLS,
      [
        ["H1", "Session start and template snapshot", S.done, "startSession() snapshots the workout (same shape the builder edits) into sessions.workoutSnapshot and redirects into /session/[id]; a one-time jsonb copy at insert, so later template edits structurally cannot change it"],
        ["H2", "Guided per-exercise screen", S.done, "/session/[id]: one exercise at a time, reusing Epic D's video embed, instructions and muscle diagram; Workout Mode takes over the full screen with global nav hidden, per VISUAL_STYLE_GUIDE.docx"],
        ["H3", "Fast set logging", S.done, "56px weight/reps inputs and Log button (VISUAL_STYLE_GUIDE.docx's Workout Mode sizing); one tap writes one session_sets row; Undo last set for a mis-tap; verified against real session_sets rows, not just the UI"],
        ["H4", "Autosave and resume", S.done, "src/domain/session-flow.ts computeSessionProgress() derives the current exercise/set from session_sets already logged, rather than a stored cursor — consistent with history being immutable. Verified: reloading mid-session (discarding all client state) resumes at the exact next set, both manually and in the Playwright test"],
        ["H5", "Rest timer", S.done, "Wall-clock countdown (Date.now() diffing, not a decrementing counter) so it stays correct even if the tab is backgrounded/throttled; Skip control. Does not persist across a full page reload — see section 4, item 31"],
        ["H6", "End-to-end tests", S.done, "Playwright (chromium), dedicated dev server on port 3100 so it never collides with a manually-running one; e2e/workout-mode.spec.ts: login, build a workout, run it with a real reload to prove resume, finish it, then abandon a second session — cleans up its own test data. npm run test:e2e"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic I — Workout History & Export"),
    table(
      EPIC_COLS,
      [
        ["I1", "History list and session detail", S.done, "/history lists every session (most recent first, in-progress sessions link to Resume); /history/[id] shows the full snapshot with every logged set per exercise, reading the same immutable workoutSnapshot Epic H writes"],
        ["I2", "Performance comparison", S.done, "Exercise detail page gets a \"Your history\" panel (top set weight and volume per past session); workout edit page gets a \"Past sessions\" panel (every session run against that specific template, by workoutId)"],
        ["I3", "Charts", S.done, "Recharts, first real use of the dependency: weekly total volume bar chart on /history, per-exercise top-set-weight line chart on the exercise detail page — both theme-aware via CSS custom properties (var(--primary) etc.), not hardcoded colors"],
        ["I4", "Export", S.done, "/history/export/csv and /history/export/json — one row per logged set, every session regardless of status, streamed with Content-Disposition: attachment. Verified: both return 200 with correct headers and the browser downloads rather than navigates"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic J — Intelligence Foundation"),
    p(
      "Not the intelligence features themselves — the substrate they need, so they can be added later without reshaping the database.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["J1", "Derived training-metrics views", S.done, "getMuscleVolumePoints() joins session_sets to each exercise's primary muscle (secondary/stabilizer excluded, so a compound lift isn't double-counted); groupMuscleVolumeByWeek() buckets into one row per (muscle, week) — src/domain/training-metrics.ts, pure and unit-tested"],
        ["J2", "Progression interfaces", S.done, "src/domain/progression.ts defines ProgressionInput/ProgressionSuggestion/ProgressionStrategy — the contract a future \"suggest next weight\" feature would need — with a NOT_IMPLEMENTED_PROGRESSION_STRATEGY that throws rather than returning a fabricated suggestion. No algorithm; deliberately just the shape"],
        ["J3", "Muscle-balance reporting", S.done, "\"Muscle balance\" panel on /history: primary-muscle volume ranked over the last 4 weeks, verified against real logged sets (Quads 810 vs Chest 300, matching hand-computed weight x reps). Read-only ranking only — no text interpreting the imbalance or suggesting what to do about it"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic K — QA & Hardening"),
    p(
      "Note: commit f380d6c labelled the content-curation work \"Epic K partial (K0)\". That was a mislabel — curation is Epic L below. Epic K remains QA & Hardening.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["K1", "Unit tests for core logic including unhappy paths", S.inProgress, "263 tests across 34 files, all passing (verified 29 July 2026). Generator, duration estimation, merge layer, session flow, history aggregation and export are covered; the profile/admin/onboarding surfaces added in Epic M are not"],
        ["K2", "Critical-path tests for each feature area", S.inProgress, "Playwright covers the full Workout Mode path (Epic H6). No e2e coverage of onboarding, PIN-gated profile deletion, or the admin dashboard"],
        ["K3", "Accessibility and mobile pass", S.inProgress, "Substantially advanced by Epic N rather than as a separate pass: AA contrast fixed at the token level (N0), 44px/56px touch targets enforced across exercises, workouts, builder, Workout Mode and history (N3-N6). Not yet done on the profile, admin, onboarding and home surfaces — those are N7/N8"],
        ["K4", "Manual QA against this plan before calling v1 done", S.notStarted, "Gaps listed explicitly rather than quietly closed"],
        ["K5", "Deploy and verify in production", S.notStarted, "Vercel; verify against the real deployment, not localhost. No longer blocked — section 4 item 36 (the unsigned admin cookie) is resolved. ADMIN_TOKEN must be set in the deployment environment or /admin returns a configuration error by design"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic L — Content Curation & Guidance"),
    p(
      "Replacing the spreadsheet's placeholder text with real sourced content, and adding a prescription layer (sets/reps/RPE/tempo) that adapts to experience level and training goal.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["L1", "Curate instructions and starting positions", S.done, "1,216 of 1,218 exercises populated from muscleandstrength.com via scripts/curate-exercises.ts — rate-limited to 1/sec, locally cached, transactional batches, tracked per-exercise in the curation_status table. 2 exercises left \"needs_review\" (parser edge cases). Written as global (profileId=null) rows in the existing exercise_overrides layer, so a re-import cannot clobber them. Revisited 2 September 2026 against a fresh site extract (data/source/muscle_strength_exercise_library_complete_master.xlsx): corrected tips for 1,151 exercises where the original curation had captured stale/generic text, and fixed instructions (plus tips, via an Overview/Instructions swap) for 4 exercises verified live against the site — Pec Foam Rolling, Incline Dumbbell Flys, Exercise Ball Cable Fly, One-Arm Standing Dumbbell Extension. The last two have an unusual page structure where the real step-by-step setup lives under \"Overview\" and the \"Instructions\" heading actually contains tips-like content"],
        ["L2", "Guidance schema", S.done, "Two-table pattern: guidance_patterns (15 canonical rows = 3 levels × 5 goals) + exercise_guidance_overrides (1,218 rows, one per exercise, FK to a pattern plus optional per-exercise regressions, alternatives, mobility/contraindication flags and form cues). Replaced an abandoned single-table design that would have needed 18,270 redundant rows — see docs/GUIDANCE_ARCHITECTURE.md"],
        ["L3", "Exercise-specific tips and common mistakes", S.done, "20 representative exercises hand-written; the remainder still fall back to pattern-level cues. Deliberately partial — see section 4, item 39"],
        ["L4", "Curation as routine maintenance", S.notStarted, "The curation run was one-off. No scheduled re-check for dead source URLs or changed upstream content"],
        ["L5", "Backfill tips for the 65 exercises with none", S.notStarted, "L1's fresh-extract reimport (above) corrected tips where the source had them but left 65 exercises with none, because neither scripts/curate-exercises.ts nor the fresh extract's own parser ever scrapes a tips section — confirmed by reading curate-exercises.ts (it only ever extracts instructions/starting_position) and by spot-checking 2 of the 65 live, both of which do have real tips on the site under an exercise-specific label (\"Side Bend Tips:\", \"Exercise Tips:\") that a single fixed-string match misses. Plan (not yet built): inspect raw HTML for a handful of these pages to pin down the actual markup, then a new scripts/curate-tips.ts reusing curate-exercises.ts's rate-limit/cache plumbing with a label-agnostic regex, dry-run reviewed before any write to exercise_overrides"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic M — Profiles, Onboarding & Admin"),
    p(
      "Turning the Epic C profile picker into a real first-run experience, and adding an owner-only surface for managing other people's profiles.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["M1", "Onboarding flow", S.done, "/onboarding — four steps (name → experience level → training goal → completion) writing experienceLevel, trainingGoal and onboardingCompletedAt onto the profile when step 4 is confirmed, which then drive which guidance pattern an exercise page shows. Was broken from shipping until 29 July 2026 — see section 4, item 47 (resolved) for the two-bug story and the fix"],
        ["M2", "Home and profile selection", S.done, "Home page profile selector and creation; /profile gains an editor and a delete section"],
        ["M3", "Profile PINs", S.done, "A 4-6 digit PIN set at profile creation and required to delete a profile. Hashed with PBKDF2-SHA256, 100k iterations, never stored in plaintext. Two real weaknesses recorded in section 4, item 35 — the salt is hardcoded and shared, and there is no attempt limiting"],
        ["M4", "Admin dashboard", S.done, "/admin — every profile with stats, and admin-side deletion that bypasses the PIN. Gated by site password + a separate ADMIN_TOKEN, 4-hour session. The gate is NOT sound as built — see section 4, item 36, and K5"],
        ["M5", "Active-profile cookie validation", S.done, "getActiveProfileId() previously returned the raw cookie without checking the profile still existed, so a cookie outliving its profile made ~20 call sites believe a deleted profile was active (/onboarding redirected away, /profile hid the delete section, scoped queries returned empty instead of erroring). Now returns null when the profile is gone; 5 tests cover the stale-cookie path"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic N — Design System Adoption"),
    p(
      "VISUAL_STYLE_GUIDE.docx existed from Epic A but had never been enforced — screens had drifted onto hand-picked colours, off-scale text and sub-44px controls. This epic makes the guide real: tokens and primitives first, then each surface moved onto them, with a lint-enforced ratchet so the count can only go down.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["N0", "Design tokens", S.done, "Four-role model per semantic colour (fill, on-fill text, on-surface text, tinted surface, tinted border) — the missing tinted-surface token was the structural reason 49 hardcoded colours existed. Primary darkened teal-600 → teal-700: white-on-primary was 3.74:1 and failed AA despite the style guide claiming compliance; now 5.47:1. Dark theme given its own values rather than the light hexes copied verbatim. Explicit radii, two elevations, one focus ring, named type scale"],
        ["N1", "UI primitives", S.done, "page-header, field, callout, empty-state, error-state, data-table, stat, confirm-dialog, number-stepper, skeletons; Button gains destructive-quiet, a 56px workout size and a loading prop; Input gains 36/44/56 sizes; Badge gains semantic variants"],
        ["N2", "Token ratchet in lint", S.done, "scripts/check-design-tokens.ts, baselined at 487 violations and wired into npm run lint so a later phase cannot regress an earlier one. Currently 209"],
        ["N3", "Exercises surface", S.done, "487 → 386. Table rebuilt on DataTable with whole-row link targets; instructional prose moved to 18px (was 14px, below the guide's floor); guidance-card rebuilt on Card + Stat + Callout"],
        ["N4", "Workouts and builder", S.done, "386 → 306. Two real layout bugs found in the browser, not by tests: 44px controls collapsed the flex-1 min-w-0 name box to zero, and a long exercise name pushed a card to 527px inside a 375px viewport"],
        ["N5", "Workout Mode", S.done, "306 → 274. NumberStepper (56px field + 56px +/- buttons, stepping by plate increment) implements a style-guide requirement that had never been built. Fixed an app-wide bug in cn(): tailwind-merge treated the named type scale as text-colour classes, so every Field label silently rendered at the inherited size"],
        ["N6", "History and charts", S.done, "274 → 209. Recharts styling extracted to chart-theme.ts. Charts verified against real data for the first time, using a throwaway profile seeded with six weeks of sessions, then deleted"],
        ["N7", "Profile and admin surfaces", S.done, "209 → 90. Both delete flows moved onto ConfirmDialog, which the primitive was designed for (its own docs name a PIN field as the example child) — the profile's PIN confirmation had been a hand-rolled expanding panel and the admin's an inline three-button row. Admin table rebuilt on DataTable with mono tabular counts; stat tiles onto Stat; a hand-rolled radio group in profile-editor given real radiogroup/radio semantics and a 44px target, having previously been unlabelled divs. 10 tests added (263 → 273), including a mutation check confirming the PIN-length test actually fails when the validation is removed"],
        ["N8", "Onboarding and home", S.done, "90 → 0. The ratchet baseline is now zero on every rule, so any new raw colour, off-scale size, stray shadow, radius or gradient fails npm run lint. New OptionCard primitive extracted for the large icon-plus-description choices in onboarding steps 2 and 3; Field, Callout and EmptyState adopted across the home selector, login form and step 1; the four-step progress rail given a text \"Step N of 4\" so progress is not conveyed by colour and position alone, and its dots marked decorative. Found two real bugs in the browser that no test caught — see section 4, items 47 and 48"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic O — Rendered Muscle Diagrams"),
    p(
      "Sequenced deliberately after Epic N: a supplied set of 1,218 anatomical renders. Assets delivered 29 July 2026 to Images/Exercise_Muscle_Group_Diagrams_1218/ in the Drive folder.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["O1", "Map filenames to exercise ids", S.done, "Verified 29 July 2026 ahead of the epic: all 1,218 filenames map 1:1 onto exercise names, zero unmatched, zero ambiguous, zero duplicate names in the database. Requires only case-folding, & → and, and collapsing non-alphanumerics. This was the main integration risk and it is not one"],
        ["O2", "Decide and set up asset hosting", S.done, "Vercel Blob, public access. scripts/upload-muscle-diagrams.ts re-derives the exact O1 mapping, refuses to proceed on any unmatched file, and uploads each as muscle-diagrams/<exercise_id>.webp (addRandomSuffix: false, so the URL is fully deterministic from exercise_id alone — no per-exercise database column needed). All 1,218 uploaded, verified against the live store with a paginated list() (list() caps a page at 1000 — the first verification run under-reported and looked like 218 uploads had silently failed; they hadn't, it was pagination) and spot-checked over real HTTP (200, correct content-type, byte-for-byte size match) at five points across the range"],
        ["O3", "Add the anatomical reference plate to the exercise detail page", S.done, "New MuscleDiagramPhoto component. Originally added beside the existing hand-built MuscleDiagram (Epic D); superseded by O5 below once coverage was confirmed complete — it now replaces MuscleDiagram on this page. 6 unit tests, mutation-checked"],
        ["O4", "Accessibility and dark theme", S.done, "Alt text built from primary_muscle/secondary_muscles in the database, not from the image (item 42) — the baked-in legend is invisible to a screen reader and can't reflect an override correction. Dark theme: the plate keeps a light background and border in both themes deliberately (item 44's chosen treatment, \"frame as a plate\") rather than trying to invert a shaded photographic render, verified in a real browser in both themes"],
        ["O5", "Replace, not just add, on the exercise detail page", S.done, "By explicit request, 29 July 2026: the hand-built MuscleDiagram (Epic D) no longer renders on /exercises/[id] — the supplied photo is the only muscle-visual there now that coverage is confirmed complete (1,218/1,218). MuscleDiagram itself is not deleted: it still renders in Workout Mode (src/components/session/session-runner.tsx), where a full photographic plate would compete for space a mid-set screen needs for logging, and that usage is what keeps VISUAL_STYLE_GUIDE.docx's teal involvement ramp meaningful (item 43's resolution — keep the ramp rather than amend it to the render's baked-in orange/navy — still holds because of this). A real consequence of the removal, handled rather than left as a silent gap: this is now the only muscle-visual on the exercise detail page, so an image load failure shows a compact ErrorState (\"Image unavailable\") instead of quietly disappearing — the previous fail-silent behaviour relied on MuscleDiagram as a fallback that no longer exists there. Test updated to assert the error state renders, mutation-checked"],
        ["O6", "Simplify the plate to just the image", S.done, "By explicit request, immediately after O5: dropped the \"ANATOMICAL REFERENCE\" eyebrow heading above the image and the \"Supplied anatomical render — approximate, not part of the source data\" caption below it. The bordered light plate itself (border, shadow-flat, fixed white background in both themes) is unchanged — only the surrounding text is gone. Verified in a real browser at 1280px"],
      ],
      EPIC_WIDTHS,
    ),
    callout(
      "A bug found and fixed along the way, unrelated to Epic O itself",
      "Verifying O3/O4 in a browser surfaced a real, previously-dormant hydration bug in the Epic D MuscleDiagram component: its SVG <title> elements passed two JSX children ({region.muscle}{role...}) where React requires exactly one — browsers only accept text content in <title>, and React 19 enforces that strictly for this element specifically. The bug existed before Epic O and is not part of it, but adding a client component next to it on the same page changed the hydration boundary enough to make it fire: the whole tree was silently regenerated on the client on every exercise-detail page load, with 38 repeated console errors. Confirmed the cause properly (an earlier check without a real page-load assertion wrongly suggested it was pre-existing and unrelated) by removing the new component and re-testing with an actual content assertion — the warning only appears once MuscleDiagramPhoto is present. Fixed with a single template-string child instead of two; verified zero warnings after.",
    ),

    h2("Epic P — Split Profile From Admin"),
    p(
      "Started 29 July 2026, by request. Complete as of commit f53e2e9: a single \"My Profile\" destination for everyone, and \"Profile\" (the all-profiles switcher and creation view) restricted to the site admin. Item 51's open question — what \"admin\" means at the profile level, with no profiles.is_admin column or other per-profile admin concept — was resolved by candidate approach (a): /profile is gated directly on getAdminSessionStatus(), i.e. \"admin\" means \"currently signed into /admin in this browser.\"",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["P1", "Add a restricted /my-profile route", S.done, "New page: the current profile's Current-profile card, ProfileEditor and DeleteProfileSection — no \"All profiles\" switcher, no \"Add a profile\" form. Redirects to / when no profile is active (there is nothing \"mine\" to show, and this route deliberately doesn't offer creation). CurrentProfileCard extracted as a shared component so /profile and /my-profile render the identical card from one source, not two copies; initials() extracted to src/lib/utils.ts, removing one of the three places it had been duplicated. 3 new unit tests"],
        ["P2", "Add it to navigation", S.done, "NAV_ITEMS (src/components/app-shell/nav-items.ts), the single source both TopBar and BottomTabBar render from, gains a 6th destination — \"My Profile\" (User icon) beside the existing \"Profile\" (icon changed to Users, plural, to read as the all-profiles view now that a singular one exists beside it). Verified at 375px: six tabs still fit the bottom bar without overflow"],
        ["P3", "Repoint the one link that meant \"edit my own profile\"", S.done, "exercise-item-guidance.tsx's \"Update your profile to change guidance\" link now goes to /my-profile — it only ever renders once a profile is active, so the redirect case doesn't apply. The three \"no profile selected, go choose or create one\" empty-state links (workouts, history) still point at /profile, correctly — that needs the picker/creation UI /my-profile deliberately doesn't have"],
        ["P4", "Gate /profile to the admin", S.done, "Resolved via item 51's candidate approach (a) — the cheapest option, reusing existing auth rather than adding a second, overlapping notion of \"admin.\" src/app/profile/page.tsx redirects any non-admin caller (getAdminSessionStatus() false) to /my-profile, and src/components/app-shell/nav-items.ts hides the \"Profile\" nav link entirely unless isAdmin — found already shipped (commit f53e2e9) during a 2026-09-01 QA-audit pass; this row and item 51 were simply never updated to match"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic Q — Workout Library"),
    p(
      "Started 29 July 2026, by request: duplicate packaged multi-day programs from muscleandstrength.com/workouts as a third option alongside Build/Generate, day-by-day, so \"add to my workouts\" can later create one workout per training day. Scoped for personal use only (item 53), not for redistribution.",
      { muted: true },
    ),
    table(
      EPIC_COLS,
      [
        ["Q1", "Source schema, scraper and import for packaged programs", S.done, "Three new source tables (source_workout_programs, source_workout_program_days, source_workout_program_exercises; migrations 0009-0010), following the same imported-vs-app-owned separation as the rest of the source layer. Grew in three stages: 4 programs (initial evaluation) -> 16 (29 July 2026, surfacing h2-level day headings, a description paragraph between heading and table, a literal \"#\" in \"Workout #1\", and Sets-column-less EMOM/circuit tables) -> 613 (2 September 2026, via a new scripts/import-workout-extract.ts reading a fresh site-wide extract instead of one-URL-at-a-time scraping). The 613-program import matches existing rows by canonical URL so hand-curated program_id values survive re-import, batches each program's day/exercise inserts (2 bulk statements regardless of program size, not one row-at-a-time await) after an initial one-row-per-await version measured at ~6 hours projected for the full batch, and fixed a URL-construction bug that double-prepended the domain. Final state: 613 programs, 1,778 days, 15,839 exercise rows, 13,237/15,839 (83.6%) matched to a library exercise by URL, zero broken or duplicate URLs, zero empty programs"],
        ["Q2", "Read-only browse UI", S.done, "/build/library (list) and /build/library/[id] (day-by-day DataTable of exercise/sets/reps/rest, matched exercises link to their library page). Added as a third, outline-styled card on /build (\"Choose from the library\") — outline deliberately distinguishes it as not yet feature-complete like the other two options. A real bug was found and fixed during visual verification: the day heading combined the DB dayNumber with a focus string that already contained its own \"Day N -\" prefix scraped from the source heading, rendering as \"Day 1 — Day 1 - Back & Biceps\"; the scraper now strips that leading label before storing focus"],
        ["Q3", "\"Add to my saved workouts\" action", S.done, "addWorkoutProgramToWorkouts creates one workout per training day (rest days and days with no matched exercises are skipped), each exercise becoming its own single block at the existing builder's default 90s block rest. A new pure src/domain/workout-program-conversion.ts converts the source's free-text sets/reps/rest into the app's structured integer fields — plain numbers and ranges (\"8-12\") parse directly; anything that isn't a number (\"AMRAP\", \"Burn\", a timed hold) falls back to 1 set / open reps with the original text preserved as a note rather than fabricated, resolving item 54. Exercises the scraper couldn't match to a real library exercise (workout_items.exercise_id is not nullable) are skipped rather than failing the whole add, and named back to the user via a warning Callout on /workouts (a new success/skipped pair of callouts driven by redirect query params). Verified against real imported data in a real browser: WP-0003 (fully matched, no timed sets) produced 3 clean workouts; WP-0001 (1 unmatched exercise, 8 burnout-set rows) produced 4 workouts with the unmatched exercise correctly surfaced in the skip callout and burnout rows landing as 1 set / open reps with a \"5 Minutes — Burn\" note. 7 new unit tests on parsePrescription, including the burnout-set and missing-data unhappy paths. Verification-run workouts deleted from the database afterward rather than left as clutter in the real profile"],
        ["Q4", "Facet-filtering UI (goal/duration/equipment/audience)", S.done, "Built (commit 8008abd) but this row was never updated to match — found during a 2 September 2026 pass. Replaced 2 September 2026, by explicit request: badge filters (goal/level/gender/duration/days) removed in favour of a single debounced free-text search box over program names, once the library held 613 real programs rather than the handful facet filtering was designed against. src/db/queries/workout-programs.ts's WorkoutProgramFilters simplified to just { search }"],
      ],
      EPIC_WIDTHS,
    ),

    h1("4. Open Questions / Assumptions"),
    p("Recorded here so they are not lost in conversation. Each is a decision made in the absence of an explicit instruction, and can be revisited.", { muted: true }),
    spacer(),
    table(
      ["#", "Assumption or open question", "Status"],
      [
        ["1", "Profiles are a lightweight picker (name + avatar), not per-person logins. The shared site password is the only credential.", "Assumed"],
        ["2", "Media (video, thumbnails) is hotlinked from the original source rather than mirrored. Cheaper and avoids redistributing others' assets, but breaks if a source URL dies.", "Assumed"],
        ["3", "Long instructional text is displayed as imported, since the spreadsheet's Instructions/Tips fields are already summarised rather than copied verbatim from the source site.", "Assumed"],
        ["4", "Muscle diagrams are custom SVG built in-house and driven by each exercise's muscle fields. Not sourced, and labelled as derived.", "Assumed"],
        ["5", "Derived spreadsheet fields carry a 'Rule Derived — Unreviewed' status. These are shown as best-effort and are user-correctable via the override layer.", "Assumed"],
        ["6", "Units: weight recorded in the profile's preferred unit (kg or lb), stored canonically to avoid conversion drift in history.", "Assumed"],
        ["7", "Playwright e2e is deferred until Workout Mode (Epic H), when there is a flow worth testing end to end.", "Assumed"],
        ["8", "12 npm audit advisories are dev-only transitive dependencies (ESLint toolchain, PostCSS). Not shipped to users; the only fix is a breaking ESLint 10 upgrade eslint-config-next does not yet support.", "Accepted"],
        ["9", "Whether the app should ever suggest load/weight for an exercise on first use, given the spreadsheet has no strength-standard data.", "Open"],
        ["10", "exceljs (for reading the source spreadsheet) pulls in transitive advisories via its zip-writer dependency (archiver). We only read files, never write, so that code path is never exercised; the advisory class matches one already accepted in the dev toolchain. Preferred over the alternative (xlsx/SheetJS), which has unpatched CVEs directly in its read path.", "Accepted"],
        ["11", "\"Not listed\" — the spreadsheet's own sentinel for an unpopulated field — is normalised to a real SQL NULL at import time, for every field, rather than kept as a magic string. Confined in practice to thumbnail_url, stabilizer_muscles, and the variation/alternative/progression/regression fields; the narrative fields (instructions, tips, etc.) never contain it.", "Decided"],
        ["12", "One muscle name found in Source Exercises (\"Middle Back\") is not in the original 22-row Muscle Taxonomy sheet. The import pipeline auto-extends the taxonomy rather than dropping the data or failing; surfaced in npm run db:report under \"Muscle taxonomy extensions\".", "Resolved"],
        ["13", "exercise_overrides.value is stored as text. Correct for the free-text fields it exists to fix (instructions, tips, etc.); a numeric or boolean override would need type-aware handling not yet built.", "Assumed"],
        ["14", "Next.js 16 renamed the middleware.ts file convention to proxy.ts (exported function middleware -> proxy) and changed its default runtime to Node.js. The password gate uses the new convention; TECHNICAL_SPEC's Server Action security note is a direct quote from Next's own proxy.ts docs.", "Resolved"],
        ["15", "Browser password-manager extensions (1Password, confirmed) can inject an overlay into type=\"password\" fields that blocks Claude in Chrome's synthetic click/type actions. Worked around during verification by setting the field value via JS and calling form.requestSubmit() immediately after navigation, before any focus event. Does not affect real users.", "Resolved"],
        ["16", "next/script's beforeInteractive strategy (used for the no-flash theme script) still triggers a React 19 dev-only console warning (\"script tag while rendering\") in this Next.js 16.2.12 build, despite being Next's own sanctioned mechanism for this exact use case. Confirmed dev-only — npm run build has no warnings, and the theme script's actual behaviour is correct (no flash observed across extensive manual testing). Not something fixable from application code; revisit on a future Next.js upgrade.", "Accepted"],
        ["17", "\"Bulleted instructions\" (spec requirement) are generated by splitting the source's flowing-prose Instructions/Tips/Common Mistakes text on sentence boundaries (src/domain/text.ts), since the source data isn't itself list-structured. Reasonable interpretation, not a literal source format.", "Decided"],
        ["18", "next/image is configured for a single remote host (cdn.muscleandstrength.com) — the only host present in the imported thumbnail URLs. A future additional import source (see Epic B's \"seed, not the ceiling\" principle) would need its host added to next.config.ts.", "Assumed"],
        ["19", "The original schema (Epic B) had no ON DELETE behaviour on any foreign key, discovered when a workout-deletion test failed with a constraint violation. Fixed: workout_blocks/workout_items/session_sets/equipment_inventory/exercise_overrides/workouts/sessions.profileId now cascade; sessions.workoutId sets null on delete (preserving history — the snapshot already has everything needed); source-layer derived tables also cascade for safety, though the import pipeline manages those directly.", "Resolved"],
        ["20", "The \"Add exercise\" picker (Epic E1) is name-search only, not the Exercise Library's full 8-filter set — a deliberate scope cut to keep the builder dialog light. Epic G's workout library or a future pass could bring the full filter bar in.", "Decided"],
        ["21", "Duration estimate constants (40s work per set, 60s rest default, 60s transition per block) are named, documented assumptions in src/domain/workout-duration.ts, not measured values — same caveat as the original estimate design in TECHNICAL_SPEC.", "Assumed"],
        ["22", "New workout items default to 3 sets, 8-12 reps — a reasonable general-purpose default, not derived from any exercise-specific data (the source has no prescription data to draw from).", "Assumed"],
        ["23", "The revised, confirmed spec ('goals, available equipment, available workout time, areas of focus, experience level') is intentionally less rigid than an earlier abandoned draft (which specified an exact goal list, exact duration options, and multi-select goal ranking). The implemented questionnaire uses single-select for goal/focus/experience and the earlier draft's clean 20/30/40/50/60 duration options, as a reasonable structured default consistent with the confirmed spec's intent.", "Decided"],
        ["24", "The generator produces one exercise per block (no auto-supersetting) — supersets/circuits are presented as a manual grouping tool (Epic E4) the user applies afterwards in the builder, not a generator decision. Keeps the algorithm's output predictable and easy to reason about.", "Decided"],
        ["25", "Reusing Epic E's estimateWorkoutMinutes for the generator's duration-fit loop means goal-driven rest time directly affects how many exercises fit — e.g. a 40-minute \"strength\" workout (150s rest) generates fewer, not more padded, exercises than a hypertrophy workout of the same length. Confirmed intentional and verified in a live run rather than assumed.", "Resolved"],
        ["26", "Two enhancements beyond the core plan were requested and built directly rather than only logged: multi-select workout building with a live duration tally (Exercise Library), and a deterministic (rule-based, no AI call) workout assessment — muscles worked, a weight/rep tip inferred from prescribed rep ranges, and a recovery tip. Both recorded in ENHANCEMENTS.docx \"Implemented\".", "Resolved"],
        ["27", "By explicit request, two enhancement ideas are sequenced to the end of the project rather than built now: photorealistic exercise images (full/thumbnail/mobile sizes, start+end position — a production asset pipeline, not app code) and an AI-powered training coach / assessment via the Claude API (to be evaluated against what the deterministic assessment turns out not to cover). See ENHANCEMENTS.docx \"Deferred to the end of the project\".", "Decided"],
        ["28", "G3 (versioning) is marked Blocked rather than built: it protects sessions from a template edit rewriting their history, but Epic H (which creates sessions) doesn't exist yet, so there is no history to protect and no way to verify versioning behaves correctly. Building it now would be speculative complexity in the builder's every-edit auto-save path. Revisit when Epic H starts.", "Decided"],
        ["29", "G4 (tags/folders/collections) is deferred past v1: G1's name search already covers the immediate need, and organisation features designed before there's a real multi-workout library in use risk solving the wrong problem. Revisit once there's enough saved-workout volume to see what's actually hard to find.", "Decided"],
        ["30", "G3 (versioning) turns out not to be needed for the reason it was originally proposed: Epic H's session snapshot (workoutSnapshot jsonb, a one-time copy taken at session start) already makes it structurally impossible for a later template edit to change what a past session displays. Template versioning is left not started — it would now only serve a different, lower-priority feature (browsing a workout's own edit history), not history integrity.", "Resolved"],
        ["31", "Workout Mode's rest timer is wall-clock based (current time minus a stored end timestamp) so the displayed countdown stays accurate even if the tab is backgrounded or throttled, but it lives only in client state — a full page reload during rest simply drops the remaining wait and shows the next set's input immediately. Session progress itself (which exercise/set) is unaffected, since that's derived from logged sets, not the timer. Accepted v1 simplification; a sound/notification when rest ends was also scoped out.", "Assumed"],
        ["32", "Workout Mode steps through a superset or circuit block's exercises sequentially (all of exercise A's sets, then all of exercise B's) rather than interleaving rounds (A, B, A, B, ...) the way the block's rest-per-round data model implies. The manual builder (Epic E) and duration estimator (Epic E5) both already model true round-robin rest; only the guided runtime takes the simpler sequential path. Documented simplification, not a data model gap — src/domain/session-flow.ts.", "Assumed"],
        ["33", "Epic I's volume calculations (weight × reps, summed) are unit-naive: they add up the raw weight numbers regardless of the recorded weight_unit, on the assumption a profile logs consistently in one unit. Workout Mode's per-set kg/lb toggle (Epic H3) makes mixed units within one profile's history possible in principle; a chart or session total spanning both would be numerically meaningless without conversion. Not yet a real-world issue (weight_unit defaults to the profile's preference every set), but worth converting to a common unit before trusting a mixed-unit history — src/domain/session-history.ts.", "Assumed"],
        ["34", "Muscle balance (J3) uses a fixed 4-week window and counts only each exercise's primary muscle (secondary/stabilizer excluded) — both reasonable starting defaults, not derived from any spec requirement. A configurable window and/or secondary-muscle weighting would need real usage to know if they're worth the added complexity.", "Assumed"],
        ["35", "FIXED — profile PINs (M3) had two real weaknesses, both closed. (a) src/lib/pin.ts used a single hardcoded salt (\"exercise-partner-salt\") shared by every profile, so identical PINs produced identical hashes. Fixed: migration 0008 adds profiles.pin_salt, generatePinSalt() produces a genuinely random 16-byte salt per profile at creation, and every profile created from here on is unlinkable from any other by hash comparison alone. Existing profiles (created before this migration) had their pin_hash computed under the old fixed salt; rather than force a PIN reset with no reset UI to support it, the migration backfills pin_salt = 'exercise-partner-salt' explicitly onto those rows — this does not make a pre-existing PIN any more guessable than it already was, it only stops the situation from getting worse, since every new profile is fully protected. A regression test pins hashPin's exact output for a known input under the legacy salt, so the backfill's compatibility can't silently break in a future refactor. (b) There was no attempt limiting. Fixed: nextPinAttemptState()/isPinLocked() (pure, unit-tested) lock a profile out for 15 minutes after 5 consecutive wrong guesses, tracked via new pin_failed_attempts/pin_locked_until columns; the lock is checked before a guess is even hashed. verifyPin now compares with crypto.timingSafeEqual rather than ===. Verified against the real database: two profiles created with the identical PIN produce different pin_hash values (queried directly, not inferred), and a live 5-wrong-guesses-then-a-correct-one-still-refused run against the running app confirms the lockout actually engages.", "Resolved"],
        ["36", "The admin dashboard (M4) was described in its own commit as a \"secure two-factor\" gate and was not one: admin_session held the literal string \"authenticated\", unsigned, so anyone who could already reach the app could set one cookie in devtools and get full admin access — including deleting any profile and all of its training history — with ADMIN_TOKEN bypassed entirely. The same forgeable check also guarded deleteProfileAsAdmin, the Server Action that does the deleting, which is reachable by direct request independently of the page. Fixed: src/lib/admin-auth.ts signs the session with HMAC-SHA256 over SESSION_SECRET, using the pattern src/lib/auth.ts has had since Epic C, under a distinct message so a site token cannot be replayed as an admin one. The 4-hour expiry now lives inside the signed payload and is enforced server-side rather than by a cookie maxAge the client can ignore. Both secrets are compared in constant time, and a wrong password and a wrong token return the same message. The Server Action verifies the session itself rather than trusting its caller. 15 unit tests plus 4 Playwright tests, the first of which replays the original attack and asserts it now lands on the login page. Note \"two-factor\" remains a misnomer — two static shared secrets in one form are two passwords, not two factors — so the UI no longer claims it.", "Resolved"],
        ["37", "RESOLVED — three .sql files sat directly in drizzle/ (0002_curation_tracking, 0003_remove_breathing_movement_pattern, 0004_exercise_experience_guidance) rather than in drizzle/migrations/, and were absent from the journal. They looked like migrations and were not — Drizzle never ran them, and their numbers collided with real migrations of the same index. Related: migrations 0005 and 0006 genuinely had SQL files with no journal entries and so had never run; that was found and fixed in commit 1396bd1 by registering both and making them idempotent. All three stray files are now archived under drizzle/archive/. A fourth, undocumented stray file in the same shape — drizzle/0005_add_program_categories.sql — turned out to still be live: it had manually patched one column that a later real migration (0011) also tried to add, so drizzle's own bookkeeping never recorded 0011 as applied and every db:migrate since silently failed closed. Found and repaired during a 2026-09-01 QA-audit pass — see CHANGELOG.md's 2026-09-01 07:24 UTC entry for the full story — and archived alongside the other three.", "Resolved"],
        ["38", "Scripts loaded only .env (local Postgres) while Next.js loads .env.local (Neon), so script writes went to a different database than the app read from. Fixed in 1396bd1 with scripts/load-env.ts, matching Next.js precedence. The same mismatch existed in playwright.config.ts and caused a failed e2e run to orphan a throwaway profile in the production database; fixed in 8dfb2dd.", "Resolved"],
        ["39", "L3 is deliberately partial: exercise-specific tips and common mistakes were hand-written for 20 representative exercises only. The other ~1,198 fall back to their guidance pattern's generic cue. This is honest rather than fabricated — generating per-exercise coaching text at scale without review would violate the \"never present derived data as sourced fact\" rule — but it does mean the depth of an exercise page varies a lot depending on which one you land on.", "Decided"],
        ["40", "The guidance system's pattern routing (seed-exercise-guidance-overrides.ts) assigns every exercise a beginner_* pattern based on movement type, and the intermediate/advanced patterns exist but are never assigned by the seeder. The level/goal personalisation is therefore wired end-to-end but currently exercises only 5 of its 15 patterns until a profile's own experienceLevel selects a different one at read time.", "Assumed"],
        ["41", "RESOLVED — the profiles table's schema comment used to read \"Lightweight — no credentials\", which stopped being true when pinHash was added in M3. Already corrected in code (src/db/schema/app.ts now documents the PIN-based access control directly); found already fixed during a 2026-09-01 QA-audit pass, this item just hadn't been updated to match.", "Resolved"],
        ["42", "FIXED — the supplied muscle diagrams (Epic O) have their text baked into the raster image, invisible to screen readers, unselectable, untranslatable. MuscleDiagramPhoto builds alt text from primary_muscle/secondary_muscles read straight from the database, never from anything the picture itself says, so an override correction is reflected in the alt text even though it can never change the pixels.", "Resolved"],
        ["43", "DECIDED — the diagrams use orange/navy for primary/secondary involvement, baked in and unchangeable; VISUAL_STYLE_GUIDE.docx specifies a single-hue teal ramp for the same purpose. Resolved by NOT amending the style guide: the teal ramp stays the app's own visual language. Updated 29 July 2026 (see O5): the hand-built MuscleDiagram (Epic D) that the ramp exists to colour was removed from the exercise detail page by explicit request once photo coverage was confirmed complete, but is kept in Workout Mode (src/components/session/session-runner.tsx), so the ramp still has something to colour there. The supplied render sits in its own bordered \"Anatomical reference\" plate with its own caption, so it reads as an inserted photograph with its own legend rather than the app's design language contradicting itself — even now that it is the only muscle-visual on the exercise detail page specifically.", "Decided"],
        ["44", "DECIDED — the diagrams render on a fixed white card with a dark navy header, unchangeable, and the app has a dark theme. Resolved as a deliberate \"plate\": the render keeps its light background and a border/shadow frame in both light and dark theme, the way a photograph or diagram plate is presented on purpose rather than left to blend into the page. Verified in a real browser in both themes — reads as intentional, not as an unstyled foreign element.", "Decided"],
        ["47", "ONBOARDING STEPS 2-4 WERE UNREACHABLE from when Epic M1 shipped until 29 July 2026. createProfile() calls revalidatePath(\"/\", \"layout\"), which re-ran the /onboarding server component; it redirected to /exercises whenever any active profile existed, and step 1 had just created one — so a new user completed step 1 and was dropped straight into the exercise library, never choosing an experience level or training goal, both of which silently kept their defaults (Beginner / General). Combined with item 40, the level-and-goal personalisation Epic L was built for had effectively never varied for anyone. A second, independent bug was masked by the first the whole time: steps 2-3 only ever set local React state, so even a user who reached step 4 would not have had their choices saved — the flow never called any write beyond step 1's createProfile. FIXED: migration 0007 adds profiles.onboarding_completed_at (nullable timestamp), distinct from experience_level/training_goal because those can't tell \"chose Beginner\" from \"never asked\". A new completeOnboarding() Server Action (src/app/(app)/profile/actions.ts) writes experience_level, training_goal AND onboarding_completed_at together when step 4 is confirmed — fixing both bugs in one write. /onboarding's guard now checks onboarding_completed_at rather than mere profile existence; the home page (/) had the identical bug via its own redirect and is fixed the same way, sending an incomplete profile to /onboarding instead of /exercises — found and fixed as a direct consequence of this change, not new scope. Verified against the real database, not just navigation: e2e/n8-screenshots.spec.ts drives all four steps and queries profiles afterward, asserting experience_level, training_goal and onboarding_completed_at all landed correctly. 6 new unit tests on OnboardingFlow, including two unhappy paths (the action rejecting, and the action throwing) and a mutation check confirming the rejection test fails when the check is removed. Known limitation, by design rather than oversight: revisiting /onboarding before step 4 restarts the flow at step 1 rather than resuming — full resumability was out of scope for this fix.", "Resolved"],
        ["48", "A second bug found in the same browser pass, introduced by Epic N8's own conversion and fixed within it: the onboarding progress rail drew incomplete steps and connectors in bg-muted, and the page ground had just moved from a gradient to a flat bg-muted, so steps 3 and 4 rendered as bare numerals with no circle and the connectors between them were invisible. Incomplete steps now use a bordered bg-background chip and connectors use bg-border. Worth recording because it is the second time in this epic that swapping a gradient for a flat token made a same-coloured element disappear, and because a token-level check cannot catch it — both classes were legal.", "Resolved"],
        ["49", "FIXED, in two layers. Layer one: drizzle.config.ts loaded env with plain dotenv/config, reading only .env (local Postgres) instead of .env.local (Neon) — the same mismatch already fixed for runtime scripts in 1396bd1, never applied to drizzle-kit itself. It now imports scripts/load-env, matching Next.js precedence. Layer two, found only after fixing layer one: db:generate still hung on an interactive rename prompt even pointed at the correct database, because drizzle-kit's own snapshot history (drizzle/migrations/meta/*_snapshot.json) stops at migration 0004 and was never updated for 0005-0007, which were hand-written. Diffing today's schema.ts against the stale 0004 snapshot looked like renaming exercise_guidance (an abandoned single-table design from 13dbdb2, never actually built) into exercise_guidance_overrides/guidance_patterns — an ambiguity drizzle-kit can only resolve by asking. Fixed by generating a correct baseline snapshot from an empty-history run of the CURRENT schema.ts (so there is nothing to rename anything from) and installing it as drizzle/migrations/meta/0007_snapshot.json, chained via prevId to the real 0004 snapshot's id. Verified three ways: db:generate against the real config now reports \"No schema changes, nothing to migrate\" with zero prompts; a throwaway test column added to profiles produced a migration containing exactly one correct ALTER TABLE line and nothing else, then was fully reverted; and no migration file was applied to the database in the process — this only repairs drizzle-kit's own bookkeeping, the real applied-migration history (0000-0007, already run) is untouched.", "Resolved"],
        ["46", "ADMIN_TOKEN was not set in this project's .env.local (confirmed 29 July 2026 by checking for the variable's presence, not its value), and the code fell back to the hardcoded \"change-me-in-production\", so the second secret was a publicly-known constant. Fixed in code: the admin gate now throws rather than falling back, for SITE_PASSWORD, ADMIN_TOKEN and SESSION_SECRET alike, and reports a configuration error instead of admitting the caller — matching src/proxy.ts, which has always refused to serve without SESSION_SECRET. ACTION STILL REQUIRED BY THE OWNER: /admin now returns a configuration error until ADMIN_TOKEN is actually set in .env.local. It is documented in .env.example with a generator command. This is deliberate — an admin page that is unreachable is a better failure than one guarded by a constant published in the repository.", "Resolved"],
        ["45", "FIXED — Epic O's 133 MB across 1,218 files was too large for /public. Resolved with a dedicated Vercel Blob store (exercise-partner-images, public access), one file per exercise at muscle-diagrams/<exercise_id>.webp with a deterministic URL (no per-exercise database column needed). All 1,218 verified present in the store and serving correct content over real HTTP.", "Resolved"],
        ["52", "RESOLVED — the app icon, favicon and \"Add to Home Screen\" icon were all still the default Next.js scaffold placeholder (src/app/favicon.ico, untouched since the initial commit). Fixed: scripts/generate-app-icons.mjs rasterizes the exact top-bar Dumbbell mark (lucide-react's own path data, teal-700 background matching --primary) to real PNGs via sharp — src/app/icon.png (32x32, browser favicon), src/app/apple-icon.png (180x180, full-bleed since iOS applies its own corner mask, iOS home screen), public/icon-192.png and public/icon-512.png (Android/PWA manifest, new src/app/manifest.ts). Old favicon.ico deleted. Found and fixed a real bug in the process: src/proxy.ts's matcher didn't exempt /manifest.webmanifest, so it was gated behind the site login and would have made \"Add to Home Screen\" install prompts fail silently on a real phone — added it alongside the existing favicon.ico exemption. Verified with real HTTP requests (200s, correct JSON, no duplicate <link> tags), and by reading the actual generated PNG pixels rather than trusting the render call succeeded — the first version, using a nested <svg>, silently rendered a blank white square because stroke inheritance didn't cross the nested viewport boundary under sharp's rasterizer; rewritten as a single flat coordinate transform.", "Resolved"],
        ["51", "RESOLVED — Epic P4 (gate /profile to the admin) was blocked on a decision this project had never needed before: what does \"administrator\" mean at the level of a profile? Today admin access (SITE_PASSWORD + ADMIN_TOKEN, an admin_session cookie) is entirely separate from the profile system — a person can have an active admin session and any profile, or no profile, active at the same time; there is no profiles.is_admin column, and profiles carry no credential beyond an optional PIN that gates only their own deletion. Three candidates were weighed: (a) gate /profile on getAdminSessionStatus() directly, i.e. \"admin\" means \"currently signed into /admin in this browser\" — cheapest, reuses existing auth, ties a navigation-visibility decision to a session that expires every 4 hours; (b) add a real profiles.is_admin flag, a designated admin profile distinct from the session-based /admin gate — more principled, but a second, overlapping notion of \"admin\" in the same app; (c) don't gate by identity at all, just stop linking to /profile from nav and leave it reachable by direct URL as a quasi-admin back door — cheapest of all, weakest. (a) was chosen and implemented (commit f53e2e9) — see Epic P4. This resolves the /admin-vs-/profile half of item 55's cross-reference; item 55's broader \"is three credential mechanisms more than this app needs\" question is separate and still open.", "Resolved"],
        ["50", "Creating the Vercel Blob store (vercel blob create-store) triggered an implicit env pull that overwrote .env.local with only the project's \"Development\"-scoped cloud variables. On investigation nothing was actually lost — SITE_PASSWORD and SESSION_SECRET have only ever lived in the separate, untouched .env file, and ADMIN_TOKEN/SITE_PASSWORD/SESSION_SECRET all already exist in Vercel's Preview/Production scope (confirmed via vercel env ls), just not \"Development\" — but this is worth knowing: any future command that triggers a Vercel env pull will silently overwrite .env.local with whatever is currently scoped to Development, dropping anything hand-added there that isn't also registered on Vercel's side. Local dev functionality was confirmed intact afterward by running the admin-auth e2e spec end to end.", "Resolved"],
        ["53", "Epic Q (Workout Library) scrapes packaged programs from muscleandstrength.com the same way Epic L curated exercise content — locally cached, rate-limited to 1 request/second, read-only. Confirmed with the user this is for personal/private use only, not redistribution or a public-facing product, before building it. If the app is ever made available beyond a small known group behind the shared password, this import source would need to be revisited.", "Decided"],
        ["54", "RESOLVED (Q3) — source day tables sometimes put a duration in the Sets column and \"Burn\" in the Reps column instead of a number (e.g. \"5 Minutes\" / \"Burn\") for timed burnout sets, confirmed against the raw source HTML rather than a parser bug. The browse view (Q2) still shows these verbatim under the generic Sets/Reps/Rest headers, consistent with section 4's rule against presenting derived data as sourced fact. \"Add to my workouts\" (Q3) can't leave a structured integer field text, though, so src/domain/workout-program-conversion.ts falls back to 1 set / open reps and keeps the original text as a note (e.g. \"5 Minutes — Burn\") rather than fabricating a number.", "Resolved"],
        ["55", "OPEN — the site's login was completely unreachable to every non-admin user for a month (2026-07-30 to 2026-08-30): a \"login redesign\" commit (1806351) replaced the working SITE_PASSWORD verification + site_session cookie in src/app/login/actions.ts with a profile-name+PIN form that never set that cookie, so every route past /login redirected straight back to it — see CHANGELOG.md and docs/technical/lessons-learned.md for the full root-cause writeup. The acute bug is FIXED (SITE_PASSWORD verification and site_session restored, verified live and via npm run test:e2e against production), but the user separately flagged the authentication workflow itself as possibly overengineered and asked for a review, not just the one bug fix. Today's surface: three independent credentials (SITE_PASSWORD, a per-profile PIN, ADMIN_TOKEN) backing three separate cookies (site_session, admin_session, and the unsigned activeProfileId), each checked in more than one place — src/proxy.ts's middleware plus, redundantly, every individual page (item 51's related /admin-vs-/profile gating question is now resolved — see Epic P4). The July 30 regression happened precisely because a routine redesign touched this surface without realising it was deleting the one thing that made every other route reachable, and nothing — lint, typecheck, or the unit suite — caught it for a month; only a stale, unrun e2e spec would have. Whether three separate credential/cookie mechanisms is the minimum this app's actual threat model (a small trusted group behind one shared password) needs, or more machinery than warranted, has still not been evaluated. Worth a dedicated review pass.", "Open"],
        ["56", "RESOLVED — the exercise count cited throughout this document (1,218) describes the original imported spreadsheet and the epics that ran against it at the time; those historical entries remain accurate for when they were written and are not being retroactively rewritten. The ~53-row discrepancy (1,218 -> 1,271) is commit 0ab7f11, \"Add 53 missing exercises from imported workout programs\" (30 July 2026): 53 exercises named EX-9001-EX-9053, no source URL, added by hand after analyzing exercises referenced by the then-16-program Workout Library batch that had no match in the existing 1,218-exercise library (equipment-specific machine variants, bodyweight movements, band/kettlebell variations) — deliberate, undocumented-in-this-plan content growth, not a data-integrity problem.", "Resolved"],
        ["57", "public/enhancements.json (a hand-maintained summary the /admin/enhancements dashboard reads) and ENHANCEMENTS.docx (the canonical source per CLAUDE.md, generated from scripts/docs/enhancements.ts) drifted out of sync for over a month with nothing to catch it — found and manually corrected in a 2026-09-01 QA-audit pass, and flagged in a code comment on the page (src/app/admin/enhancements/page.tsx) so the next drift is at least visible. The correction is one-time; nothing stops it recurring the next time either file changes. A real fix would need a decision: generate the JSON from the same enhancements.ts data at npm run docs time (one source of truth, but couples a build script to a runtime file under public/), or have the admin page read structured data exported from enhancements.ts directly instead of a static JSON file. Not decided; flagged as a suggestion, not built.", "Open"],
        ["58", "/build/library's listWorkoutProgramsByCategory has no pagination or row cap — it now queries across 613 programs (up from the 4-36 the page was built and tested against). Measured at 241ms for the full unfiltered query in production, which is not currently broken, but was flagged rather than silently accepted since the query will keep growing with any future import. Not decided whether it needs a limit/offset or virtualized list; revisit if it's ever measured slow.", "Open"],
      ],
      [6, 79, 15],
    ),

    h1("5. Changelog"),
    table(
      ["Date", "Change"],
      [
        [
          formatDate(),
          "Documentation caught up on five undocumented-or-drifted items found while working through fresh site extracts: Q1's program count (16 -> 613), Q4 (facet filtering was actually built in commit 8008abd and just never marked done here, then replaced today per explicit request), L1's tips/instructions corrections below, item 56's 53-exercise mystery (resolved: commit 0ab7f11, deliberate), and a new item 58 flagging /build/library's now-unbounded query at 613 rows.",
        ],
        [
          formatDate(),
          "Workout Library's browse page (Q4) replaced its goal/level/gender/duration/days badge filters with a single debounced free-text search box over program names, by explicit request now that the library holds 613 real programs rather than the handful the original facet filters were designed against. Also fixed a latent display bug found in the process: a real 0-week/0-day program value rendered as a literal \"0\" badge instead of being hidden, because the old code used a `0 && (...)` truthiness check rather than an explicit null/positive test.",
        ],
        [
          formatDate(),
          "Workout Library grown from 36 to 613 programs via a new scripts/import-workout-extract.ts, reading a fresh site-wide extract instead of scraping one URL at a time. Matches existing programs by canonical URL so hand-curated program_id values survive re-import. First version awaited one DB insert per exercise row and projected ~6 hours to finish; rewritten to batch each program's days and exercises into 2 bulk statements regardless of program size (~7x faster). Also fixed a URL-construction bug that double-prepended the site domain, which had produced 91 malformed duplicate-URL rows on the first real run — deleted before the clean reimport. Final state verified: 613 programs, 1,778 days, 15,839 exercise rows, 13,237 (83.6%) matched to a library exercise by URL, zero broken/duplicate URLs, zero empty programs.",
        ],
        [
          formatDate(),
          "Corrected exercise instructions and tips against a fresh site extract (data/source/muscle_strength_exercise_library_complete_master.xlsx, 1,218 rows). Tips corrected for 1,151 exercises where the original Epic L1 curation had captured stale or generic text. Separately, 4 exercises' instructions (and, for 2 of them, tips) were fixed after live-verifying each against muscleandstrength.com: Pec Foam Rolling, Incline Dumbbell Flys, Exercise Ball Cable Fly, and One-Arm Standing Dumbbell Extension. The last two have an unusual page structure where the real step-by-step setup sits under an \"Overview\" heading and the page's \"Instructions\" heading actually holds tips-like content — handled by swapping which extract field feeds which override field, rather than by fabricating a split. 65 exercises remain with no tips at all; a plan for backfilling them is recorded as Epic L5 rather than built now.",
        ],
        [
          formatDate(),
          "Workout Library expanded from 4 to 16 imported programs (64 training days, 408 exercise rows, 370/408 matched) spanning splits, beginner programs, women's programs, bodyweight/home options and single-lift specialization programs. Found and fixed four more real page-structure variants the original 4-program batch hadn't surfaced: h2-level day headings, a description paragraph between a heading and its table, a literal \"#\" in \"Workout #1\", and tables with no Sets column (sets/reps are now read by matching the header row's own labels instead of a fixed position). Also found and fixed a false positive the broadened heading search introduced: it could grab an unrelated table under a generic section heading (a weight-progression chart under \"The Workouts\") — a candidate table is now only accepted if its header row contains an \"Exercise\" column. Verified with a database-level audit for suspicious non-exercise rows (zero found) and a real-browser check of the two most structurally different new programs.",
        ],
        [
          formatDate(),
          "Epic Q3 complete: \"Add to my workouts\" turns a library program into real workouts, one per training day. A new pure conversion layer (src/domain/workout-program-conversion.ts) maps the source's free-text sets/reps/rest onto the app's structured integer fields, falling back to 1 set / open reps with the original text kept as a note for anything that isn't a plain number or range — timed burnout sets (\"5 Minutes\" / \"Burn\") rather than fabricating a set count (resolves section 4 item 54). Exercises the scraper couldn't match to a real library exercise are skipped rather than failing the whole add, and named back to the user via a new warning Callout on /workouts, alongside a success Callout confirming how many workouts were created. Verified against real imported data in a real browser for both a fully-matched program and one with an unmatched exercise and burnout sets; 7 new unit tests including the burnout-set and missing-data unhappy paths.",
        ],
        [
          formatDate(),
          "Epic Q evaluation checkpoint (Q1-Q2): a read-only Workout Library. Three new source tables (source_workout_programs/_days/_exercises, migrations 0009-0010) hold packaged multi-day programs scraped from muscleandstrength.com by scripts/import-workout-programs.ts, which handles three distinct page-structure variants found across real program pages. 4 programs imported for review (4 Day Maximum Mass Workout, Upper/Lower 4 Day Bodybuilding Workout, 3 Day PPL for Beginners, 12 Week Fat Destroyer) — 104/106 exercise rows matched to an existing library exercise. New /build/library and /build/library/[id] pages, plus a third \"Choose from the library\" card on /build. A real bug was found and fixed during visual verification (not just via the passing Playwright assertions, which only checked text presence): day headings duplicated the day number, e.g. \"Day 1 — Day 1 - Back & Biceps\", because the scraper stored the source heading's full text — including its own \"Day N -\" label — as focus, and the page template prepended \"Day {n} — \" again on top of it; fixed by stripping the redundant label at parse time and re-running the import. \"Add to my saved workouts\" (Q3) and facet filtering (Q4) are deliberately not built yet — this checkpoint exists so real imported data can be evaluated before deciding on either. 316 tests passing, typecheck and lint clean, design-token ratchet unchanged at 0/0.",
        ],
        [
          formatDate(),
          "Epic N7 complete (design system on the profile and admin surfaces). Token violations 209 → 90; tests 263 → 273. Both destructive flows moved onto the ConfirmDialog primitive rather than staying hand-rolled: /profile's PIN confirmation had been an expanding inline panel and the admin table's an inline three-button row, and neither kept the failure reason visible the way the primitive does. The admin table moved onto DataTable with mono tabular counts, its stat tiles onto Stat, and its empty case onto EmptyState. profile-editor's level/goal pickers were unlabelled divs of buttons with no radio semantics and a sub-44px target; they are now a real radiogroup with aria-checked and a 44px floor. Two pieces of copy were corrected rather than restyled, because restyling them would have preserved something false: the admin dashboard's green \"✓ Secure Connection — protected by two-factor authentication\" panel now states plainly that the session cookie is unsigned and the gate is bypassable (section 4, item 36), and the admin login's security note now says what an attacker actually gets. 10 tests added, including a deliberate mutation check that confirmed the PIN-length test fails when the validation is removed rather than passing vacuously. Verified in a real browser at 1280px and 375px in both themes, via a new throwaway Playwright spec (e2e/n7-screenshots.spec.ts) that creates its own profile and asserts the cleanup actually removed it. The first run of that spec was itself wrong and produced twelve screenshots labelled with two themes but rendered in one: it toggled a data-theme attribute, while the app selects its theme with a dark class on <html> applied pre-hydration by NO_FLASH_THEME_SCRIPT. Corrected, then re-run. Confirmed with the real markup that a fixed bottom tab bar appearing over content in the full-page captures is a screenshot artifact, not a layout bug — the shell already reserves pb-20 md:pb-0.",
        ],
        [
          formatDate(),
          "Documentation brought current after 17 undocumented commits (the generators had not been touched since Epic J). Three epics added to reflect what was actually built: L (Content Curation & Guidance), M (Profiles, Onboarding & Admin) and N (Design System Adoption). Epic K's statuses corrected from Not Started to In Progress where later work had covered them incidentally. Verified against the code rather than the commit messages, which found three things the commits had overstated or missed: the admin dashboard's session cookie is unsigned and its \"secure two-factor\" claim is false (section 4, item 36 — now blocking K5); profile PINs share one hardcoded salt and have no attempt limiting (item 35); and three stray .sql files in drizzle/ are not migrations despite looking like them (item 37). Current verified state: 263 tests across 34 files passing, typecheck clean, lint clean apart from one unused-directive warning, 209 design-token violations remaining.",
        ],
        [
          "29 July 2026",
          "Epic N phases 0-6 complete (Design System Adoption). VISUAL_STYLE_GUIDE.docx had existed since Epic A but had never been enforced; this epic made it real. N0 rebuilt the colour tokens on a four-role model (fill, on-fill text, on-surface text, tinted surface, tinted border) and fixed a genuine accessibility failure — white-on-primary was 3.74:1 and failed AA despite the style guide claiming compliance, now 5.47:1 after darkening teal-600 to teal-700. N1 added ten new primitives. N2 wired scripts/check-design-tokens.ts into npm run lint as a ratchet baselined at 487 violations, so no later phase can regress an earlier one. N3-N6 then moved the exercises, workouts/builder, Workout Mode and history surfaces onto them, taking violations 487 → 209 and tests 166 → 263. Three real bugs were found by doing this that tests had not caught: cn() silently dropped every named type-scale class because tailwind-merge treated them as text-colour classes (so every Field label rendered at the wrong size); a 44px control collapsed the builder's flex-1 min-w-0 name box to zero width; and a long exercise name pushed a card to 527px inside a 375px viewport. Workout Mode's NumberStepper implements a 56px +/- requirement the style guide had always specified and no code had ever built. History's charts were verified against real data for the first time, using a throwaway six-week profile that was then deleted. Phases N7 (profile/admin, 84 violations) and N8 (onboarding/home, 30) remain.",
        ],
        [
          "28 July 2026",
          "Epic M complete (Profiles, Onboarding & Admin). A four-step onboarding flow (name → experience level → training goal → completion) writes experienceLevel and trainingGoal onto the profile, which then select which guidance pattern each exercise page shows. Home gains a profile selector and creation; /profile gains an editor and a delete section. Profile deletion is gated by a 4-6 digit PIN hashed with PBKDF2-SHA256 at 100k iterations. An /admin dashboard lists every profile with stats and can delete one bypassing its PIN. Two security weaknesses are recorded rather than glossed: the admin session cookie is unsigned and therefore forgeable (section 4, item 36), and the PIN salt is hardcoded and shared across profiles with no attempt limiting (item 35). Neither is remotely exploitable — /admin sits behind the site password gate — but item 36 blocks K5 (production deploy). Also fixed a real bug where getActiveProfileId() returned the raw cookie without checking the profile still existed, so a cookie outliving its profile made roughly 20 call sites believe a deleted profile was active.",
        ],
        [
          "28 July 2026",
          "Epic L complete apart from L4 (Content Curation & Guidance). 1,216 of 1,218 exercises had their placeholder \"Varies / Not specified\" instructions and starting positions replaced with real sourced content from muscleandstrength.com, via a rate-limited, locally-cached, transactionally-batched scraper tracked per-exercise in a new curation_status table; the run completed 99.84% in about 45 minutes with no manual intervention, leaving 2 exercises flagged needs_review. Content is written as global (profileId=null) rows in the existing exercise_overrides layer, so a spreadsheet re-import cannot clobber it — the Epic B separation rule doing exactly the job it was designed for. A guidance layer was added on a two-table pattern (15 canonical guidance_patterns + 1,218 exercise_guidance_overrides), replacing an abandoned single-table design that would have required 18,270 redundant rows to say the same thing; see docs/GUIDANCE_ARCHITECTURE.md. Exercise-specific tips and common mistakes were hand-written for 20 representative exercises only, with the rest falling back to pattern-level cues — deliberately partial rather than fabricated (section 4, item 39).",
        ],
        [
          "27 July 2026",
          "Epic J complete (Intelligence Foundation) — substrate for future intelligence features, not the features themselves. J1: getMuscleVolumePoints() + groupMuscleVolumeByWeek() (src/domain/training-metrics.ts) derive volume per primary muscle group per week per profile, joining session_sets through exercise_muscles (primary role only, so a compound lift's volume isn't double-counted across every muscle it merely assists). J2: src/domain/progression.ts defines the contract a future \"suggest next weight\" feature would need (ProgressionInput/ProgressionSuggestion/ProgressionStrategy) with a NOT_IMPLEMENTED_PROGRESSION_STRATEGY that throws rather than fabricating a suggestion — deliberately no algorithm yet. J3: a \"Muscle balance\" panel on /history ranks primary-muscle volume over the last 4 weeks as a plain read-only bar list — verified against real logged sets (Quads 810 vs Chest 300, matching the hand-computed weight x reps) — with no interpretive text suggesting what, if anything, to do about the ranking. All J1/J3 aggregation is pure and unit-tested (8 tests, src/domain/training-metrics.ts).",
        ],
        [
          "27 July 2026",
          "Epic I complete (Workout History). /history lists every session (most recent first), in-progress ones linking to Resume rather than a static detail view; /history/[id] shows the full immutable snapshot with every logged set per exercise. Exercise detail pages get a \"Your history\" panel (weight/volume per past session plus a top-set-weight trend line, Recharts' first real use); workout edit pages get a \"Past sessions\" panel scoped to that specific template via sessions.workoutId. /history also shows a weekly total-volume bar chart once there's more than one week of data. Both /history/export/csv and /history/export/json stream the complete one-row-per-set history (every session, not a summary) with a real Content-Disposition: attachment download, verified to return 200 and trigger a download rather than a navigation. All of Epic I's aggregation (volume, weekly bucketing, per-session collapsing) is pure and unit-tested (src/domain/session-history.ts, src/domain/export.ts — 21 tests combined) rather than computed inline in a page. Verified end-to-end in a real browser: built and ran two real sessions of the same workout at different weights, confirmed the trend chart, session detail, and both exports all agreed with the underlying session_sets rows inspected directly in the database.",
        ],
        [
          "26 July 2026",
          "Epic H complete (Workout Mode). /session/[id] takes over the full screen (global nav hidden, per VISUAL_STYLE_GUIDE.docx) and guides one exercise at a time from an immutable snapshot taken at session start (sessions.workoutSnapshot — the same shape the builder edits, so it structurally cannot be changed by a later template edit). 56px weight/reps inputs and Log button write one session_sets row per tap, with an Undo for mis-taps. Session progress (current exercise/set) is derived from session_sets already logged, not a stored cursor (src/domain/session-flow.ts, 10 unit tests) — verified that reloading mid-session, which discards all client state, resumes at the exact next set. Rest timer between sets is wall-clock based (Date.now() diffing) so it stays correct even if the tab is backgrounded, with a Skip control; does not persist across a full reload (see section 4, item 31). Finishing marks the session completed; the exit control requires an explicit confirm dialog before abandoning. All of the above verified end-to-end in a real browser, including inspecting the resulting session/session_sets rows directly in the database, not just the UI. Playwright installed for the first time (H6): a single full run-through test (login, build a workout, run it including a real page reload to prove resume, finish it, then abandon a second session) runs against a dedicated dev server on port 3100 and cleans up its own test data — npm run test:e2e. G3 (versioning), previously blocked pending Epic H, turns out not to be needed for its original purpose: the session snapshot already protects history from template edits (section 4, item 30).",
        ],
        [
          "26 July 2026",
          "Epic G partially complete (Workout Library) — G1 and G2 built, G3 and G4 explicitly deferred rather than skipped silently (see section 4, items 28-29). /workouts replaces the Epic A-era placeholder: name search, exercise count and estimated duration per card (computed the same way the builder does), archive/restore via the existing archivedAt column, and a duplicate that deep-copies blocks and items into fully independent rows — verified at the database level, not just visually, that a duplicated workout's rows are distinct from the original's. Also added, by request: multi-select exercise cards on the Exercise Library (checkbox overlay, a live duration tally that survives filter navigation because the selection provider lives at the (app) layout level, and one-click bulk workout creation), and a deterministic per-workout assessment (muscles worked, a weight-selection tip inferred from actual prescribed rep ranges, a recovery tip) — both logged in ENHANCEMENTS.docx \"Implemented\". Two further ideas — photorealistic exercise images and an AI-powered coach/assessment — logged as explicitly deferred to the end of the project rather than built now.",
        ],
        [
          "26 July 2026",
          "Epic F complete (Intelligent Workout Generator). 5-step questionnaire (goal, duration, focus, experience, equipment) feeds a pure, unit-tested selection algorithm (src/domain/generator/, 15 tests): one compound anchor exercise per relevant movement pattern first for push/pull/squat/hinge/core balance, then diverse accessory work, compound-first ordering, and a duration-fit loop reusing Epic E's own duration estimator so goal-driven rest time genuinely changes how many exercises fit. Equipment answers are saved as a full profile snapshot to equipment_inventory. Generated workouts seed a real workout row and redirect straight into Epic E's existing builder — review, substitute and save came for free from Epic E rather than needing a separate UI. Verified end-to-end in a real browser: a 40-minute strength-goal full-body workout correctly generated only 3 exercises (not padded to more) because strength's 150s rest genuinely fills the time budget faster, and the full equipment selection (5 of 28) persisted correctly as a complete have/no snapshot.",
        ],
        [
          "26 July 2026",
          "Epic E complete (Manual Workout Builder). /build hub (\"start from scratch\" now functional; generator stubbed for Epic F) creates a draft workout and opens the builder. Full CRUD via Server Actions: add exercise (new block or grouped into an existing one, auto-promoting to superset), reorder blocks via dnd-kit drag-and-drop, per-item prescription (sets/reps/rest/notes) with auto-save on blur, per-block rest and a Superset/Circuit label toggle, remove (auto-reverting a block to \"single\" when it drops to one item), and inline substitution reusing Epic D's candidate data. Live duration estimate (src/domain/workout-duration.ts, 8 unit tests) recalculates after every change. All of the above verified end-to-end in a real browser against real data, including that changes persist across a reload and that deleting a profile correctly cascades to its workouts. Found and fixed a real schema gap along the way: no foreign key had ON DELETE behaviour, so deleting a workout failed outright — added cascade/set-null rules across the app-owned tables (new migration 0001).",
        ],
        [
          "26 July 2026",
          "Epic D complete (Exercise Library). Browse/search/filter/sort with 8 filter dimensions and URL-driven state (all 18 filter/pagination unit tests passing); table and card views. Exercise detail page with bulleted instructions/tips/mistakes, a custom-built front+back SVG muscle diagram (23 canonical muscles mapped to simplified regions, explicitly labelled as derived), video embed with YouTube+Vimeo support and source-link fallback, and both relationship types (rule-derived substitutions and human-curated variation/alternative/progression/regression links) — all verified end-to-end in a real browser against real data, including secondary-muscle filtering and a styled 404 for bad exercise ids. Fixed a real React 19 warning by moving the theme script to next/script's beforeInteractive strategy.",
        ],
        [
          "26 July 2026",
          "Epic C complete. App shell built: responsive top bar (desktop) / bottom tab bar (mobile), light/dark theme with no flash of unstyled content, VISUAL_STYLE_GUIDE.docx's teal palette applied to the theme tokens (replacing shadcn's generic grey defaults). Fixed a real bug found along the way: --font-sans was self-referential in globals.css, so the app was silently falling back to system fonts instead of Geist Sans. Password gate built on Next.js 16's Proxy convention (HMAC-signed cookie, constant-time password comparison) with Server Actions independently verifying the session per Next's own security guidance. Profile switcher (dialog + full /profile page) built: create, list, switch, and a per-profile weight-unit preference — verified end-to-end in a real browser, including that switching profiles correctly isolates each profile's data. Fixed shadcn's default button/input heights (32px) up to the style guide's 44px touch-target minimum.",
        ],
        [
          "26 July 2026",
          "Epic B complete. Drizzle schema (15 tables) migrated to local Postgres. Import pipeline built and run: 1,218/1,218 exercises imported, idempotency verified by re-run (0 added/0 changed on the second pass), 4,448 muscle links and 600 related-exercise links derived (596 resolved to an exercise id via URL match), 3,638 substitution candidates imported. Fixed a data-quality bug where the spreadsheet's \"Not listed\" sentinel was being stored as literal text instead of NULL. Merged read model (mergeOverrides) built, unit tested, and verified end-to-end. Local Postgres 16 provisioned via Homebrew; initial git commit made.",
        ],
        [
          "26 July 2026",
          "Project goal, users and stack confirmed. Next.js scaffold created with Tailwind 4, shadcn/ui, Drizzle, Vitest; lint, typecheck and tests verified green. Epic B–K deliverables defined. Word deliverables generated from scripts.",
        ],
        ["[init]", "Project plan created from starter template. No code written yet."],
      ],
      [18, 82],
    ),

    footer("Generated from scripts/docs/project-plan.ts — regenerate with npm run docs"),
  ]);

  return writeDocx("PROJECT_PLAN.docx", doc);
}
