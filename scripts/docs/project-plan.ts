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
        ["A5", "Create README.md, CHANGELOG.md, and the four Word deliverables", S.inProgress, "Generated via npm run docs"],
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
        ["B1", "Provision Postgres and wire up Drizzle", S.notStarted, "Neon via Vercel Marketplace; local .env for development"],
        ["B2", "Design and migrate the source-layer schema", S.notStarted, "exercises_source, equipment/muscle taxonomies, exercise_relationships"],
        ["B3", "Design and migrate the app-layer schema", S.notStarted, "profiles, overrides, workouts, sessions, logged sets"],
        ["B4", "Build the idempotent import pipeline", S.notStarted, "xlsx → Postgres; safe to re-run; reports added/changed/unchanged"],
        ["B5", "Build the merged read model", S.notStarted, "Overrides layered over source at query time"],
        ["B6", "Import verification and data-quality report", S.notStarted, "Row counts, sparse-field audit, unhappy-path tests"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic C — Design System & App Shell"),
    table(
      EPIC_COLS,
      [
        ["C1", "Write VISUAL_STYLE_GUIDE.docx", S.notStarted, "Palette, typography, spacing, components, UI voice — decided once, referenced thereafter"],
        ["C2", "Build the app shell", S.notStarted, "Responsive nav, light/dark, mobile-first layout"],
        ["C3", "Password gate and profile switcher", S.notStarted, "Middleware cookie session; profile scopes all app data"],
        ["C4", "Core component set", S.notStarted, "Buttons, inputs, cards, dialogs, empty/loading/error states"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic D — Exercise Library"),
    table(
      EPIC_COLS,
      [
        ["D1", "Browse, search, filter and sort", S.notStarted, "Muscle, equipment, type, mechanics, force, level, region, video availability"],
        ["D2", "Table and card views", S.notStarted, "Toggleable; URL-driven state so views are shareable"],
        ["D3", "Exercise detail page", S.notStarted, "The authoritative reference page for each movement"],
        ["D4", "Muscle diagram component", S.notStarted, "Custom SVG body map; not in the spreadsheet — built, and labelled as derived"],
        ["D5", "Media handling", S.notStarted, "Embedded video where embeddable, prominent source link otherwise"],
        ["D6", "Substitutions and related exercises", S.notStarted, "Seeded from the 3,639 pre-computed relationship rows"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic E — Manual Workout Builder"),
    table(
      EPIC_COLS,
      [
        ["E1", "Add exercises from the library while building", S.notStarted, "Search and filter without losing builder state"],
        ["E2", "Drag-and-drop reordering", S.notStarted, "dnd-kit; keyboard-accessible"],
        ["E3", "Per-exercise prescription", S.notStarted, "Sets, reps or rep range, rest, notes"],
        ["E4", "Supersets and circuits", S.notStarted, "Grouping model that Workout Mode understands"],
        ["E5", "Live estimated duration", S.notStarted, "Updates as sets, rest and grouping change"],
        ["E6", "Inline substitution", S.notStarted, "Swap an exercise for a suggested alternative in place"],
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
        ["F1", "Questionnaire flow", S.notStarted, "Goals, duration, focus, equipment, experience, constraints"],
        ["F2", "Equipment-aware candidate filtering", S.notStarted, "Driven by the Equipment Inventory the user maintains"],
        ["F3", "Selection and balance engine", S.notStarted, "Movement-pattern coverage, push/pull balance, no redundant overlap"],
        ["F4", "Ordering and time-fitting", S.notStarted, "Compound-first; fits the chosen duration including rest and transitions"],
        ["F5", "Review, substitute and save", S.notStarted, "Generated workouts are fully editable before saving"],
        ["F6", "Generator test suite", S.notStarted, "Constraint tests plus unhappy paths (no equipment, impossible focus)"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic G — Workout Library"),
    table(
      EPIC_COLS,
      [
        ["G1", "Save, list and search workouts", S.notStarted, "Scoped to the active profile"],
        ["G2", "Duplicate, edit and archive", S.notStarted, "Archive rather than hard delete by default"],
        ["G3", "Versioning", S.notStarted, "Editing a workout never rewrites history already recorded against it"],
        ["G4", "Organisation", S.notStarted, "Tags, folders or collections"],
      ],
      EPIC_WIDTHS,
    ),

    h2("Epic H — Workout Mode"),
    table(
      EPIC_COLS,
      [
        ["H1", "Session start and template snapshot", S.notStarted, "Session captures the workout as it was at start time"],
        ["H2", "Guided per-exercise screen", S.notStarted, "Visuals, muscle diagram, instructions, prescription, video"],
        ["H3", "Fast set logging", S.notStarted, "Weight, reps, sets, notes — minimal taps, thumb-reachable"],
        ["H4", "Autosave and resume", S.notStarted, "Progress survives a closed tab, backgrounded app or dead battery"],
        ["H5", "Rest timer", S.notStarted, "Runs between sets; keeps working when the screen is off"],
        ["H6", "End-to-end tests", S.notStarted, "Playwright: full workout run-through including resume"],
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
      ],
      [6, 79, 15],
    ),

    h1("5. Changelog"),
    table(
      ["Date", "Change"],
      [
        [formatDate(), "Project goal, users and stack confirmed. Next.js scaffold created with Tailwind 4, shadcn/ui, Drizzle, Vitest; lint, typecheck and tests verified green. Epic B–K deliverables defined. Word deliverables generated from scripts."],
        ["[init]", "Project plan created from starter template. No code written yet."],
      ],
      [18, 82],
    ),

    footer("Generated from scripts/docs/project-plan.ts — regenerate with npm run docs"),
  ]);

  return writeDocx("PROJECT_PLAN.docx", doc);
}
