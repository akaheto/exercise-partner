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
        ["I1", "History list and session detail", S.notStarted, "Permanent, immutable record of every completed workout"],
        ["I2", "Performance comparison", S.notStarted, "Same exercise and same workout over time"],
        ["I3", "Charts", S.notStarted, "Volume and progression trends (Recharts)"],
        ["I4", "Export", S.notStarted, "CSV and JSON; complete history, not a summary"],
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
        ["J1", "Derived training-metrics views", S.notStarted, "Volume per muscle group, per week, per profile"],
        ["J2", "Progression interfaces", S.notStarted, "Defined contracts, deliberately unimplemented"],
        ["J3", "Muscle-balance reporting", S.notStarted, "Read-only insight; no recommendations yet"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic K — QA & Hardening"),
    table(
      EPIC_COLS,
      [
        ["K1", "Unit tests for core logic including unhappy paths", S.notStarted, "Generator, duration estimation, merge layer"],
        ["K2", "Critical-path tests for each feature area", S.notStarted, "CRUD and session integrity"],
        ["K3", "Accessibility and mobile pass", S.notStarted, "Keyboard, contrast, touch targets, one-handed use"],
        ["K4", "Manual QA against this plan before calling v1 done", S.notStarted, "Gaps listed explicitly rather than quietly closed"],
        ["K5", "Deploy and verify in production", S.notStarted, "Vercel; verify against the real deployment, not localhost"],
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
      ],
      [6, 79, 15],
    ),

    h1("5. Changelog"),
    table(
      ["Date", "Change"],
      [
        [
          formatDate(),
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
