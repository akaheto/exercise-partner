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
        ["Derived", "exercise_muscles, exercise_equipment", "Regenerated at import from source fields"],
        ["App", "profiles, exercise_overrides, equipment_inventory, workouts, workout_blocks, workout_items, sessions, session_sets", "Never touched by import"],
      ],
      [14, 46, 40],
    ),
    spacer(),
    p(
      "Reads go through a merge layer that overlays exercise_overrides on top of source_exercises, so a user correction to a mis-derived field survives every future re-import. Overrides are sparse — only changed fields are stored — so re-imported improvements to untouched fields still flow through.",
    ),

    h1("3. Tech Stack"),
    table(
      ["Concern", "Choice", "Rationale"],
      [
        ["Framework", "Next.js 16 (App Router, TypeScript)", "Server Components suit a read-heavy reference library; Server Actions avoid a bespoke API layer; first-class on Vercel"],
        ["Styling", "Tailwind CSS 4", "Utility-first keeps styling colocated; v4 engine is materially faster"],
        ["Components", "shadcn/ui (Base UI primitives)", "Accessible primitives owned in-repo rather than versioned as a dependency — themeable to the style guide without fighting a vendor theme"],
        ["Database", "PostgreSQL (Neon)", "Relational model fits taxonomies and history; window functions and CTEs are what the future analytics work will need"],
        ["ORM", "Drizzle", "Typed schema with explicit SQL-shaped queries and reviewable migrations; no hidden query generation"],
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
    p("Proposed for Epic B. Column lists are indicative rather than exhaustive.", { muted: true }),

    h3("Source layer"),
    table(
      ["Table", "Key columns", "Notes"],
      [
        ["source_exercises", "exercise_id (PK, e.g. EX-0001), name, url, video_url, thumbnail_url, primary_muscle, secondary_muscles, stabilizer_muscles, equipment, exercise_type, mechanics, force, experience_level, instructions, tips, common_mistakes, breathing, movement pattern flags, body_region, laterality, derived_status", "Verbatim mirror of the Source Exercises sheet (52 columns). Rebuilt on import."],
        ["source_equipment", "equipment_id (PK), canonical_name, source_native, description", "29 rows from Equipment Taxonomy"],
        ["source_muscles", "muscle_id (PK), canonical_name, source", "23 rows from Muscle Taxonomy"],
        ["source_relationships", "from_exercise_id, to_exercise_id, relationship_type, similarity_score, evidence_type, evidence_url, review_status, notes", "3,639 pre-computed substitution candidates"],
      ],
      [20, 50, 30],
    ),

    h3("Derived layer (regenerated at import)"),
    table(
      ["Table", "Key columns", "Purpose"],
      [
        ["exercise_muscles", "exercise_id, muscle_id, role (primary | secondary | stabilizer)", "Normalises the semicolon-delimited muscle strings into joinable rows so muscle filters are indexable"],
        ["exercise_equipment", "exercise_id, equipment_id", "Same, for equipment — and what makes equipment-aware generation possible"],
      ],
      [20, 44, 36],
    ),

    h3("App layer"),
    table(
      ["Table", "Key columns", "Notes"],
      [
        ["profiles", "id, display_name, avatar, preferred_weight_unit, created_at", "Lightweight; no credentials"],
        ["exercise_overrides", "exercise_id, profile_id (nullable = global), field, value, updated_at", "Sparse per-field overrides layered over source at read time"],
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
      "Two mechanisms protect history from later template edits. First, **sessions carry a jsonb snapshot** of the workout exactly as it was when the session started. Second, **session_sets reference exercise_id directly** rather than workout_item_id, so a set stays meaningful even if the block or item that prescribed it is later deleted.",
    ),
    p(
      "Weight is stored in a single canonical unit with the entered unit recorded alongside it, so a profile switching between kg and lb never introduces rounding drift into historical comparisons.",
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
      ],
      [24, 38, 38],
    ),

    h1("6. Known Limitations & Open Risks"),
    h3("Data quality"),
    bullet("Most derived fields in the spreadsheet carry a 'Rule Derived — Unreviewed' status. They are usable defaults, not verified fact, and are surfaced as such."),
    bullet("Several fields are sparsely populated or marked 'Not listed' — notably Variations, Alternative Exercises, Progression and Regression. The UI must degrade gracefully rather than showing empty sections."),
    bullet("Starting Position and Range of Motion frequently contain generic 'Varies / Not specified' text that defers to the source page."),
    bullet("The 3,639 relationship rows are rule-derived candidates with review status 'Unreviewed'. Substitutions are presented as suggestions, never as equivalences."),

    h3("Media"),
    bullet("All 1,218 exercises have a video URL and 1,194 have a thumbnail, but no exercise has a GIF or animation — so 'realistic visuals of proper movement' rests on video plus a single still image."),
    bullet("Embeddability is assumed from the URL shape (YouTube embed links). Any that refuse embedding must fall back to a prominent source link."),
    bullet("Hotlinked assets can disappear without warning. A link-health check is a candidate enhancement."),

    h3("Product"),
    bullet("The generator has no strength-standard data, so it cannot suggest starting loads. Whether it should ever try is an open question in the plan."),
    bullet("Estimated workout duration is a model, not a measurement. It should be calibrated against real recorded session durations once history exists."),
    bullet("Profiles do not isolate data securely; anyone with the site password can view or switch to any profile."),

    h3("Technical"),
    bullet("12 npm audit advisories are dev-only transitive dependencies (ESLint toolchain, PostCSS). Not shipped to users; the only fix is a breaking ESLint 10 upgrade that eslint-config-next does not yet support."),
    bullet("Workout Mode autosave must survive backgrounded mobile tabs, which browsers may suspend aggressively. This needs real device testing, not just desktop."),

    footer("Generated from scripts/docs/technical-spec.ts — regenerate with npm run docs"),
  ]);

  return writeDocx("TECHNICAL_SPEC.docx", doc);
}
