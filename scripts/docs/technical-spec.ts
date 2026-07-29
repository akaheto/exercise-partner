import {
  bullet,
  buildDocument,
  callout,
  footer,
  formatDate,
  h1,
  h2,
  h3,
  p,
  rich,
  spacer,
  subtitle,
  table,
  title,
  writeDocx,
} from "./shared";

export async function generateTechnicalSpec() {
  const doc = buildDocument([
    title("Technical Specification — Exercise Partner"),
    subtitle(`Last updated: ${formatDate()}   ·   Living document — updated as each epic lands`),

    h1("1. Overview"),
    rich(
      "Exercise Partner is a personal exercise knowledge base and workout platform for a small, known group of users. It ingests a 1,218-exercise research spreadsheet as its seed database and builds four capabilities on top: an **exercise reference library**, **manual and generated workout building**, a **guided workout mode**, and a **permanent training history**.",
    ),
    p(
      "The architectural priority is extensibility over minimalism. The spreadsheet is a starting point, not the schema: later phases will add exercises from other sources, and later features will read training history to make recommendations. The design assumes both from day one.",
    ),

    h2("Non-goals for v1"),
    bullet("Progression recommendations, plateau detection and overtraining warnings — architected for, deliberately not built."),
    bullet("Per-user authentication. A single shared password gates the site; profiles are a data-scoping mechanism, not a security boundary."),
    bullet("Native mobile apps. The web app is mobile-first and must work well one-handed, but ships as a responsive site."),
    bullet("Offline-first operation. Workout Mode tolerates brief connection loss via optimistic local writes, but is not a full offline app."),

    h1("2. Architecture"),
    h2("Shape"),
    rich(
      "A single **Next.js 16 App Router** application deployed to Vercel. Server Components query Postgres directly for read-heavy pages (the exercise library, workout library, history). Mutations go through **Server Actions**, which keeps the surface area small — there is no separate REST/GraphQL layer to maintain for a single first-party client.",
    ),
    spacer(),
    table(
      ["Layer", "Responsibility"],
      [
        ["Route handlers / Server Components", "Data fetching and page composition; no business logic"],
        ["Server Actions", "All writes; validation via Zod at the boundary"],
        ["Domain modules (src/domain)", "Generator, duration estimation, substitution ranking, volume math — pure functions, no I/O, directly unit-testable"],
        ["Data access (src/db)", "Drizzle schema, queries, and the source/override merge layer"],
        ["UI (src/components)", "Presentational components built on shadcn/ui primitives"],
      ],
      [34, 66],
    ),
    spacer(),
    callout(
      "Why this matters",
      "Keeping the generator and other judgement-making logic as pure functions in src/domain is what makes them testable. Anything that decides something on the user's behalf must be reachable without a database or a browser.",
    ),

    h2("The two-layer data principle"),
    rich(
      "The single most important architectural rule: **imported data and app-owned data never share a table.** The spreadsheet import is destructive-by-design within its own layer — it can drop and rebuild source tables — and must never be able to damage user data.",
    ),
    spacer(),
    table(
      ["Layer", "Tables", "Import behaviour"],
      [
        ["Source", "source_exercises, source_equipment, source_muscles, source_relationships", "Rebuilt from the spreadsheet on every import"],
        ["Derived", "exercise_muscles, exercise_equipment, exercise_links", "Regenerated at import from source fields"],
        ["App", "profiles, exercise_overrides, equipment_inventory, workouts, workout_blocks, workout_items, sessions, session_sets", "Never touched by import"],
      ],
      [14, 46, 40],
    ),
    spacer(),
    p(
      "Reads go through a merge layer that overlays exercise_overrides on top of source_exercises, so a user correction to a mis-derived field survives every future re-import. Overrides are sparse — only changed fields are stored — so re-imported improvements to untouched fields still flow through.",
    ),

    h2("Access control"),
    rich(
      "A single **Proxy** file (src/proxy.ts — Next.js 16 renamed the middleware.ts convention to proxy.ts, and defaults it to the Node.js runtime) checks every request for an HMAC-signed session cookie and redirects to /login if it's missing or invalid, preserving the originally requested path via a next query param. Login compares the submitted password against SITE_PASSWORD using a constant-time comparison, then signs the session cookie with SESSION_SECRET — both plain env vars, no database involved.",
    ),
    p(
      "Server Actions are reachable directly by request, independent of Proxy's route matching, so a matcher change or route refactor could silently stop protecting one without the other — this is called out in Next's own Proxy docs. Every Server Action that writes app data calls requireSiteSession() (src/lib/require-site-session.ts) itself rather than trusting Proxy alone.",
    ),
    p(
      "A separate httpOnly cookie (active_profile_id) scopes the UI to one profile at a time; switching profiles is a Server Action that overwrites the cookie and revalidates the layout. This is a data-scoping convenience, not a security boundary — see the Key Decisions table below. As of Epic M5 the cookie is validated against the database before it is trusted: getActiveProfileId() returns null when the referenced profile no longer exists, because a cookie outliving its profile previously made roughly 20 call sites believe a deleted profile was active.",
    ),
    rich(
      "Two further gates were added in Epic M, and **neither is as strong as its feature name suggests.** Profile deletion requires a 4-6 digit PIN (PBKDF2-SHA256, 100k iterations) — but the salt is hardcoded and shared across all profiles, and there is no attempt limiting. The /admin dashboard requires the site password plus a separate ADMIN_TOKEN — but the session cookie it issues is unsigned, so the token can be bypassed by setting one cookie by hand. Both are detailed in section 6; the admin one blocks production deployment.",
    ),

    h1("3. Tech Stack"),
    table(
      ["Concern", "Choice", "Rationale"],
      [
        ["Framework", "Next.js 16 (App Router, TypeScript)", "Server Components suit a read-heavy reference library; Server Actions avoid a bespoke API layer; first-class on Vercel"],
        ["Styling", "Tailwind CSS 4", "Utility-first keeps styling colocated; v4 engine is materially faster"],
        ["Components", "shadcn/ui (Base UI primitives)", "Accessible primitives owned in-repo rather than versioned as a dependency — themeable to the style guide without fighting a vendor theme"],
        ["Database", "PostgreSQL — local via Homebrew for dev, Neon in production", "Relational model fits taxonomies and history; window functions and CTEs are what the future analytics work will need"],
        ["ORM", "Drizzle", "Typed schema with explicit SQL-shaped queries and reviewable migrations; no hidden query generation"],
        ["Spreadsheet import", "exceljs", "Reads the source workbook for the import pipeline; see Known Limitations for why it was chosen over xlsx/SheetJS"],
        ["Validation", "Zod 4", "One schema shared by Server Action input validation and TypeScript types"],
        ["Drag & drop", "dnd-kit", "Keyboard-accessible reordering — a hard requirement for the builder"],
        ["Charts", "Recharts", "Composable React charts for history and volume trends"],
        ["Unit tests", "Vitest + Testing Library", "Fast, ESM-native, shares Vite config conventions"],
        ["E2E tests", "Playwright (from Epic H)", "Deferred until Workout Mode exists — the flow most worth testing end to end"],
        ["Docs", "docx (npm)", "Word deliverables generated from scripts so they can be kept current cheaply"],
        ["Hosting", "Vercel", "Matches the framework; preview deployments per change"],
      ],
      [14, 24, 62],
    ),

    h1("4. Data Model"),
    p(
      "Implemented in Epic B — 15 tables, migrated to Postgres via Drizzle and confirmed against real imported data. Column lists are indicative rather than exhaustive; see src/db/schema/*.ts for the full definitions.",
      { muted: true },
    ),

    h3("Source layer"),
    table(
      ["Table", "Key columns", "Notes"],
      [
        ["source_exercises", "exercise_id (PK, e.g. EX-0001), name, url, video_url, thumbnail_url, primary_muscle, secondary_muscles, stabilizer_muscles, equipment, exercise_type, mechanics, force, experience_level, instructions, tips, common_mistakes, breathing, movement pattern flags, body_region, laterality, derived_status, source_row_hash, imported_at", "Verbatim mirror of the Source Exercises sheet (52 columns), plus two import-pipeline columns (not from the spreadsheet) used for change detection on re-import"],
        ["source_equipment", "equipment_id (PK), canonical_name, source_native, description", "28 rows from Equipment Taxonomy"],
        ["source_muscles", "muscle_id (PK), canonical_name, source", "22 rows from Muscle Taxonomy, plus any auto-extension (see section 6)"],
        ["source_relationships", "from_exercise_id, to_exercise_id, relationship_type, similarity_score, evidence_type, evidence_url, review_status, notes", "3,638 pre-computed substitution candidates"],
      ],
      [20, 50, 30],
    ),

    h3("Derived layer (regenerated at import)"),
    table(
      ["Table", "Key columns", "Purpose"],
      [
        ["exercise_muscles", "exercise_id, muscle_id, role (primary | secondary | stabilizer)", "Normalises the comma-delimited muscle strings into joinable rows so muscle filters are indexable"],
        ["exercise_equipment", "exercise_id, equipment_id", "Same, for equipment — and what makes equipment-aware generation possible"],
        ["exercise_links", "from_exercise_id, relation_type (variation | alternative | progression | regression), label, url, to_exercise_id (nullable)", "Parsed from the Variations/Alternative Exercises/Progression/Regression columns — human-curated links distinct from source_relationships' rule-derived candidates. to_exercise_id is resolved by matching url against another row's url; kept as label + url when no match is found rather than dropped"],
      ],
      [20, 44, 36],
    ),

    h3("App layer"),
    table(
      ["Table", "Key columns", "Notes"],
      [
        ["profiles", "id, display_name, avatar, preferred_weight_unit, experience_level, training_goal, pin_hash, onboarding_completed_at, created_at", "No longer credential-free: experience_level and training_goal were added in Epic M1 (they select the guidance pattern an exercise page shows), and pin_hash in M3 (PBKDF2-SHA256, 100k iterations, gates profile deletion). The schema comment in src/db/schema/app.ts still reads \"Lightweight — no credentials\" and is stale. onboarding_completed_at (migration 0007) is nullable and distinct from experience_level/training_goal on purpose — those default to Beginner/General, so their mere presence can't distinguish a real choice from a profile that never finished onboarding, which was the root cause of section 6's onboarding-redirect bug"],
        ["exercise_overrides", "exercise_id, profile_id (nullable = global), field, value, updated_at", "Sparse per-field overrides layered over source at read time. Epic L1's 2,432 curated instruction/starting-position rows are stored here as global (profile_id = null) overrides, so a spreadsheet re-import cannot clobber them"],
        ["curation_status", "exercise_id, status, source, fetched_at, error", "Per-exercise progress tracking for the Epic L1 curation run — which exercises succeeded, which need review, and why"],
        ["guidance_patterns", "id (PK, e.g. beginner_strength), experience_level, training_goal, recommended_sets, recommended_reps_min, recommended_reps_max, target_rpe, tempo, breathing_cue, form_cue", "15 canonical rows = 3 experience levels × 5 training goals. Updating guidance for a level/goal combination is a one-row update that every exercise using it inherits through the FK join"],
        ["exercise_guidance_overrides", "id, exercise_id (UNIQUE FK), pattern_id (FK), regression_tier_1..3_exercise_id + notes, alternative_1..2_exercise_id + notes, required_mobility, contraindicated_for, minimum_experience_level, exercise_specific_form_cue, beginner_safety_cue", "1,218 rows, one per exercise: which pattern it follows, plus optional exercise-specific customisations. All override columns are nullable — null means inherit the pattern"],
        ["equipment_inventory", "profile_id, equipment_id, status, notes", "What each person actually has — drives generator filtering"],
        ["workouts", "id, profile_id, name, description, version, parent_workout_id, archived_at, created_at, updated_at", "Templates. Editing creates a new version rather than mutating in place"],
        ["workout_blocks", "id, workout_id, position, kind (single | superset | circuit), rest_seconds", "Grouping layer that Workout Mode understands"],
        ["workout_items", "id, block_id, exercise_id, position, sets, reps_min, reps_max, rest_seconds, notes", "One prescribed exercise within a block"],
        ["sessions", "id, profile_id, workout_id (nullable), workout_snapshot (jsonb), status, started_at, completed_at", "One performance of a workout"],
        ["session_sets", "id, session_id, exercise_id, set_number, weight, weight_unit, reps, rpe, notes, completed_at", "The actual recorded performance"],
      ],
      [18, 48, 34],
    ),

    h3("History integrity"),
    rich(
      "Three mechanisms protect history from later template edits. First, **sessions carry a jsonb snapshot** of the workout exactly as it was when the session started. Second, **sessions.workoutId sets null (not cascade) on delete** — deleting the template entirely still doesn't touch the session, since the snapshot already has everything needed. Third, **session_sets reference exercise_id directly** rather than workout_item_id, so a set stays meaningful even if the block or item that prescribed it is later deleted.",
    ),
    p(
      "Weight is stored in a single canonical unit with the entered unit recorded alongside it, so a profile switching between kg and lb never introduces rounding drift into historical comparisons.",
    ),
    p(
      "Everything else in the app-owned schema cascades on delete (workout → blocks → items; profile → workouts/sessions/overrides/equipment inventory), added in migration 0001 after a real bug: the original schema had no ON DELETE behaviour at all, so deleting a workout failed outright with a foreign-key violation. Discovered and fixed during Epic E's verification, not left for Epic G to trip over.",
    ),

    h1("5. Key Decisions & Tradeoffs"),
    table(
      ["Decision", "Why", "Cost accepted"],
      [
        ["Two-layer source/app separation", "The spreadsheet is a seed, not the ceiling; re-import must be safe", "A merge layer on every exercise read, and more tables than a flat design"],
        ["Postgres over SQLite or a document store", "Future analytics are inherently relational and aggregate-heavy", "Requires a hosted database rather than a file in the repo"],
        ["Server Actions instead of a REST API", "One first-party client; avoids maintaining a parallel API surface", "Would need an API layer added if a native client ever appears"],
        ["Shared password + profile picker", "Matches a small trusted group; no credential management", "Not a real security boundary between profiles — anyone with the password can switch profile"],
        ["Hotlinked media", "Avoids redistributing others' assets and storage cost", "Breaks if a source URL dies; needs periodic link checking"],
        ["Workout versioning over in-place edits", "History must stay truthful about what was actually prescribed", "More rows, and UI must make 'which version' legible"],
        ["Custom SVG muscle diagrams", "The spreadsheet has no diagram assets; a body map is the clearest way to show involvement", "Real build effort, and accuracy is approximate at muscle-group granularity"],
        ["Generator as pure functions", "Judgement logic must be testable without a database", "Requires threading candidate data in explicitly rather than querying inline"],
        ["Guidance as patterns + overrides, not one wide table", "15 canonical rows plus 1,218 mappings say what 18,270 redundant rows would have said; changing guidance for a level/goal combination becomes a one-row update", "Every guidance read is a join, and per-exercise customisation has to be modelled as explicit nullable override columns"],
        ["Curated content written into the existing override layer", "Epic B's rule that imported and app-owned data never share a table means 2,432 scraped instruction rows survive a spreadsheet re-import for free", "Curation is invisible in source_exercises; anything inspecting the source tables directly sees the old placeholder text"],
        ["Design tokens enforced by a lint ratchet", "The style guide had existed since Epic A and was being ignored; a baselined counter that can only decrease makes drift fail CI instead of accumulating", "A hand-maintained baseline file, and the check is textual — it catches raw hex and off-scale classes, not visual wrongness"],
      ],
      [24, 38, 38],
    ),

    h1("6. Known Limitations & Open Risks"),
    h3("Data quality — confirmed by npm run db:report against the imported data"),
    bullet("All 1,218 exercises carry 'Rule Derived — Unreviewed' derived-status. They are usable defaults, not verified fact, and are surfaced as such."),
    bullet("Relationship fields are sparse: Variations 42.5% (518), Progression 3.0% (36), Regression 0.7% (8), Alternative Exercises 0.6% (7). The UI must degrade gracefully rather than showing empty sections."),
    bullet("Stabilizer Muscles is populated for 0 of 1,218 exercises — the column exists in the schema for when a future source populates it, but currently carries no data."),
    bullet("69.8% of exercises (850) have a generic 'Varies / Not specified' Body Position rather than a specific one."),
    bullet("One muscle name in the exercise data ('Middle Back') is not in the original 22-row Muscle Taxonomy sheet. The import pipeline auto-extends the taxonomy rather than dropping the muscle link or failing the import."),
    bullet("The 3,638 relationship rows are rule-derived candidates with review status 'Unreviewed', similarity 55–100 (average 97.3), averaging 3.0 candidates per exercise. Substitutions are presented as suggestions, never as equivalences."),

    h3("Media"),
    bullet("1,218 of 1,218 exercises have a video URL and 1,194 (98.0%) have a thumbnail, but no exercise has a GIF or animation — so 'realistic visuals of proper movement' rests on video plus a single still image."),
    bullet("Video is not exclusively YouTube: 443 of 1,218 video URLs are Vimeo player embeds. Both are iframe-embeddable, but embeddability logic must handle both shapes, not just youtube.com/embed."),
    bullet("Hotlinked assets can disappear without warning. A link-health check is a candidate enhancement."),

    h3("Product"),
    bullet("The generator has no strength-standard data, so it cannot suggest starting loads. Whether it should ever try is an open question in the plan."),
    bullet("Estimated workout duration is a model, not a measurement. It should be calibrated against real recorded session durations once history exists."),
    bullet("Profiles do not isolate data securely; anyone with the site password can view or switch to any profile."),
    bullet("FIXED 29 July 2026 — onboarding steps 2-4 were unreachable from Epic M1's original ship until this date. createProfile()'s revalidatePath re-ran /onboarding's server component, which redirected to /exercises the instant step 1 created a profile, so experience level and training goal were never actually chosen. A second bug was masked by the first the whole time: even a user who reached step 4 would not have had their answers saved, since steps 2-3 only set local React state and nothing wrote it. Fixed together via migration 0007 (profiles.onboarding_completed_at) and a completeOnboarding() Server Action that writes experience_level, training_goal and the completion timestamp in one update when step 4 is confirmed; the guard now checks completion rather than mere existence. The home page (/) had the identical redirect bug independently and is fixed the same way. See section 4's Data Model above for the new column, and PROJECT_PLAN.docx section 4 assumption 47 for the full account — including a known limitation: revisiting /onboarding before completing it restarts the flow rather than resuming it."),

    h3("Security — found by auditing the code against its own commit messages, 29 July 2026"),
    rich(
      "**Fixed — the admin session is now signed.** admin_session held the literal string \"authenticated\", unsigned, so one hand-set cookie granted full admin access (including deleting any profile and its entire history) with ADMIN_TOKEN bypassed. The same check also guarded deleteProfileAsAdmin, the Server Action that performs the deletion and is reachable by direct request regardless of which page rendered the button. src/lib/admin-auth.ts now signs the session with HMAC-SHA256 over SESSION_SECRET — the pattern src/lib/auth.ts has used since Epic C — under a distinct message so a site token cannot be replayed as an admin one, with the 4-hour expiry inside the signed payload so it is enforced by the server rather than by a cookie maxAge the client can ignore. The Server Action verifies the session itself instead of trusting its caller. Covered by 15 unit tests and 4 Playwright tests, the first of which replays the original attack.",
    ),
    rich(
      "**Fixed — the gate fails closed.** SITE_PASSWORD and ADMIN_TOKEN fell back to \"change-me\" and \"change-me-in-production\" when unset, and ADMIN_TOKEN was in fact unset on this project, so the second secret was a published constant. All three secrets are now required, and a missing one produces a configuration error rather than an admitted request — matching src/proxy.ts. Both secrets are compared in constant time, and a wrong password and a wrong token return the same message so the response cannot be used to work out which half is right.",
    ),
    p(
      "Still true, and still a misnomer: two static shared secrets submitted through the same form are two passwords, not two factors. The UI no longer claims otherwise.",
      { muted: true },
    ),
    bullet("STILL OPEN — profile PINs use one hardcoded salt (\"exercise-partner-salt\") shared by every profile, so identical PINs yield identical hashes. Anyone with database read access can see which profiles share a PIN, and one precomputed table covers the whole 4-6 digit keyspace. A per-profile random salt stored beside the hash is the fix. There is also no attempt limiting, so a 4-digit PIN is exhaustible in 10,000 requests, and verifyPin compares with === rather than constant-time."),

    h3("Technical"),
    bullet("Three .sql files sit directly in drizzle/ (0002_curation_tracking, 0003_remove_breathing_movement_pattern, 0004_exercise_experience_guidance) instead of drizzle/migrations/, and are not in the journal. Drizzle never runs them, and their indices collide with real migrations of the same number. Related: migrations 0005 and 0006 genuinely had SQL files with no journal entries and had therefore never run — found and fixed in commit 1396bd1 by registering both and making them idempotent."),
    rich(
      "**Fixed — db:generate works again, without an interactive prompt.** Two layered bugs. drizzle.config.ts loaded env with plain dotenv/config (.env only, local Postgres) instead of .env.local (Neon) — the same class already fixed for scripts in 1396bd1, never applied to the config file drizzle-kit itself reads; now imports scripts/load-env. That alone was not enough: drizzle-kit's own snapshot history stopped at migration 0004, and 0005-0007 (hand-written) never got matching snapshots, so diffing today's schema.ts against the stale 0004 snapshot looked like renaming the abandoned exercise_guidance table into exercise_guidance_overrides/guidance_patterns — an ambiguity only resolvable interactively. Repaired by installing a correct 0007 snapshot generated from an empty-history run of the current schema (so nothing could look like a rename), leaving the real applied-migration SQL history untouched. Verified three ways: a clean db:generate now reports no changes; a throwaway test column produced exactly one correct ALTER TABLE line before being reverted; nothing was applied to the database in the repair itself.",
    ),
    bullet("Guidance pattern routing currently assigns every exercise a beginner_* pattern based on movement type, so 10 of the 15 patterns are reachable only once a profile's own experience level selects them at read time. The personalisation is wired end to end but lightly exercised."),
    bullet("12 npm audit advisories are dev-only transitive dependencies (ESLint toolchain, PostCSS). Not shipped to users; the only fix is a breaking ESLint 10 upgrade that eslint-config-next does not yet support."),
    bullet("exceljs (used to read the source spreadsheet in the import pipeline) pulls in further advisories via its zip-writer dependency chain, which reading a file never exercises. Chosen over xlsx/SheetJS, whose read-path prototype-pollution and ReDoS CVEs have no fix available."),
    bullet("Workout Mode autosave must survive backgrounded mobile tabs, which browsers may suspend aggressively. This needs real device testing, not just desktop."),

    footer("Generated from scripts/docs/technical-spec.ts — regenerate with npm run docs"),
  ]);

  return writeDocx("TECHNICAL_SPEC.docx", doc);
}
