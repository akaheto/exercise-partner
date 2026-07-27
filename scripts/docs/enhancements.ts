import {
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

const COLS = ["Idea", "What it does", "Why it fits", "Effort"];
const WIDTHS = [20, 34, 34, 12];

export async function generateEnhancements() {
  const doc = buildDocument([
    title("Enhancements — Exercise Partner"),
    subtitle(`Last updated: ${formatDate()}   ·   Running list — updated whenever an idea comes up, not only when built`),

    p(
      "Ideas are logged here as soon as they are raised, whether or not they are built. Anything in \"Not Yet Implemented\" is a candidate, not a commitment — items move to \"Implemented\" only once shipped and verified.",
      { muted: true },
    ),
    callout(
      "Scope note",
      "Items already committed in PROJECT_PLAN.docx (Epics A–K) are not repeated here. This document covers capabilities beyond the current v1 plan.",
    ),

    h1("Implemented"),
    p("Ideas beyond the core PROJECT_PLAN.docx deliverables that shipped along the way.", { muted: true }),
    spacer(),
    table(
      ["Idea", "What it does", "Shipped"],
      [
        [
          "Multi-select workout building",
          "Select several exercises directly from the Exercise Library's cards and add them all to a new workout in one action, with a running duration estimate visible while selecting",
          formatDate(),
        ],
        [
          "Deterministic workout assessment",
          "On the workout builder: which muscles the workout trains (and which body regions it doesn't touch), a weight-selection tip inferred from the rep ranges actually prescribed, and a recovery tip based on the muscle groups hit — all rule-based, no AI call",
          formatDate(),
        ],
      ],
      [24, 56, 20],
    ),

    h1("Not Yet Implemented"),

    h2("Deferred to the end of the project"),
    p(
      "Explicitly sequenced last, by request — either because they need production photography/video work that doesn't make sense to do repeatedly while the app is still changing, or because they should be evaluated against what the deterministic version above actually turns out to need.",
      { muted: true },
    ),
    spacer(),
    table(
      COLS,
      [
        [
          "Photorealistic exercise images",
          "Real photography or generated images showing each exercise's start and end position, exported in full, thumbnail, and mobile sizes; thumbnails would replace the current hotlinked source images in the library card list",
          "The spreadsheet has only one static thumbnail per exercise (see TECHNICAL_SPEC.docx \"Media\" limitations) — this is the closest thing to the spec's original \"photorealistic visual\" requirement, but it's a production asset pipeline, not app code, and not worth doing more than once",
          "Large",
        ],
        [
          "AI-powered training coach / assessment",
          "Replace or augment the deterministic workout assessment with a Claude API call — a natural-language coach that can answer follow-up questions, or a richer assessment than fixed rules can produce",
          "Worth evaluating once there's real usage of the deterministic version to see what it actually can't do — an LLM call adds cost, latency, and a new failure mode (hallucinated advice) that a fixed rule set doesn't have",
          "Medium",
        ],
      ],
      WIDTHS,
    ),

    h2("Training practicality — highest value for the least work"),
    p("These address friction that shows up the first time the app is used in an actual gym.", { muted: true }),
    spacer(),
    table(
      COLS,
      [
        ["Plate calculator", "Given a target barbell weight and available plates, show exactly what to load per side", "Removes arithmetic mid-session — one of the most-used features in commercial training apps", "Small"],
        ["Rest timer alerts", "Audio cue and vibration when rest ends, working with the screen off or the app backgrounded", "A silent timer is useless once the phone is in a pocket", "Small"],
        ["Warm-up set generation", "Auto-propose warm-up ramp sets from the first working set's load", "Standard practice for compound lifts; tedious to enter by hand every session", "Small"],
        ["Estimated 1RM", "Calculate and trend estimated one-rep max from logged sets (Epley / Brzycki)", "Turns raw set logs into a progress signal without needing a max-effort test", "Small"],
        ["Personal record detection", "Automatically flag when a set beats the best previous performance for that exercise", "The single most motivating piece of feedback history can produce", "Medium"],
        ["Previous performance inline", "Show last session's weight and reps next to each set input during a workout", "Answers \"what did I do last time?\" without leaving Workout Mode", "Small"],
      ],
      WIDTHS,
    ),

    h2("Personalisation & safety"),
    table(
      COLS,
      [
        ["Exercise exclusions", "Mark exercises to never suggest, with an optional reason (injury, dislike, unavailable)", "The generator is only trustworthy if it respects known constraints", "Small"],
        ["Injury / contraindication flags", "Per-profile flags (e.g. lower back, shoulder) that filter the generator's candidate pool", "Directly affects safety — the most consequential kind of personalisation here", "Medium"],
        ["Favourites", "Star exercises for fast access when building workouts", "Most people rotate a small core set; surfacing it speeds up manual building", "Small"],
        ["Substitution learning", "Remember which swaps the user actually makes and rank future suggestions accordingly", "Turns the unreviewed rule-derived relationship data into something that improves with use", "Medium"],
      ],
      WIDTHS,
    ),

    h2("Knowledge base quality"),
    table(
      COLS,
      [
        ["Data curation UI", "Review and correct fields marked \"Rule Derived — Unreviewed\", writing to the override layer", "1,218 exercises carry unreviewed derived data; this is how it gets better over time", "Medium"],
        ["Media link health check", "Scheduled job verifying hotlinked videos and images still resolve, flagging dead ones", "All media is hotlinked, so silent link rot is a real and untracked risk", "Small"],
        ["Exercise aliases & synonyms", "Search matches common alternative names (e.g. \"RDL\" → Romanian Deadlift)", "Exercise naming varies widely; exact-name search will frustrate", "Small"],
        ["Additional source import", "Import pipeline for exercise sources beyond the original spreadsheet, with provenance per exercise", "Explicitly anticipated — the spreadsheet is a seed, not the ceiling", "Medium"],
        ["Video timestamp deep-links", "Link directly to the demonstration moment rather than the video start", "Cuts the time between \"how does this go?\" and the answer", "Small"],
      ],
      WIDTHS,
    ),

    h2("Programming beyond single workouts"),
    table(
      COLS,
      [
        ["Multi-week programs", "Group workouts into a structured block (e.g. a 4-week progression) with a schedule", "The natural next unit above a single workout; most real training is programmed in blocks", "Large"],
        ["Training calendar", "Calendar view of past and planned sessions", "Makes consistency and gaps visible at a glance", "Medium"],
        ["Muscle recovery view", "Heatmap of recent volume per muscle group indicating what is fresh today", "Answers \"what should I train?\" from data already being collected", "Medium"],
        ["Repeat with progression", "Duplicate last session's workout with loads advanced by a chosen rule", "The most common real-world workflow, currently requiring manual re-entry. Epic J2 already defines the contract this would implement (ProgressionStrategy in src/domain/progression.ts) — deliberately left unimplemented pending real usage data to know what rule is actually worth building", "Medium"],
        ["Workout template edit history", "Browse and revert previous versions of a saved workout template itself", "Originally planned as G3 \"versioning\" to protect session history from template edits — turned out not to be needed for that, since Epic H's session snapshot already handles it. Would now only serve editing convenience, not integrity", "Medium"],
      ],
      WIDTHS,
    ),

    h2("Platform & convenience"),
    table(
      COLS,
      [
        ["Offline PWA", "Installable app with offline Workout Mode and deferred sync", "Gym signal is frequently poor; losing a logged set to a dead connection is unacceptable", "Large"],
        ["Voice logging", "Speak \"sixty kilos, eight reps\" to log a set hands-free", "Hands are chalky, gloved or occupied at exactly the moment logging is needed", "Medium"],
        ["Printable workout sheet", "Clean PDF/print view of a workout", "Useful when a phone is impractical or unwanted on the gym floor", "Small"],
        ["Workout import/export", "Share a workout as a portable JSON file", "Lets workouts move between profiles or be backed up independently", "Small"],
        ["Desktop keyboard shortcuts", "Full keyboard operation of the workout builder", "The builder is a desktop-heavy task; shortcuts make it substantially faster", "Small"],
        ["Body metrics tracking", "Log bodyweight and measurements alongside training history", "Provides the context that makes strength trends interpretable", "Medium"],
        ["Health platform export", "Export sessions to Apple Health / Google Fit", "Keeps this app the training system of record without isolating its data", "Medium"],
      ],
      WIDTHS,
    ),

    h1("Rejected / Deferred"),
    p("Recorded with reasoning so the same ideas are not re-litigated later.", { muted: true }),
    spacer(),
    table(
      ["Idea", "Decision", "Reasoning"],
      [
        ["Social feed, following, leaderboards", "Rejected", "Contradicts the stated vision of a personal training ecosystem, and would turn a private, password-gated app into a service with moderation and privacy obligations"],
        ["Nutrition and calorie tracking", "Deferred", "A large domain in its own right — its own database, its own UI, its own accuracy problems. Would double the scope without deepening the training product"],
        ["Camera-based form checking", "Rejected", "Cannot be made reliable enough to be safe. Confidently telling someone their deadlift is fine when it is not is the worst failure this app could produce"],
        ["Wearable heart-rate integration", "Deferred", "Introduces hardware and vendor API dependencies for value that only applies to conditioning work. Revisit if conditioning becomes a focus"],
        ["Per-profile passwords", "Deferred", "The shared-password model matches a small trusted group. Revisit only if the app is ever used by people who should not see each other's data"],
        ["Multi-language support", "Deferred", "No current need. Noted because retrofitting i18n is far more expensive than designing for it — worth revisiting before the UI grows large"],
      ],
      [20, 14, 66],
    ),

    h1("How ideas get here"),
    rich(
      "Anything raised in conversation lands in **Not Yet Implemented** immediately, even if it will not be built soon. When something ships it moves to **Implemented** with the date. When something is ruled out it moves to **Rejected / Deferred** with the reasoning, so the decision survives the conversation that produced it.",
    ),

    footer("Generated from scripts/docs/enhancements.ts — regenerate with npm run docs"),
  ]);

  return writeDocx("ENHANCEMENTS.docx", doc);
}
