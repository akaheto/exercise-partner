import {
  bullet,
  buildDocument,
  callout,
  footer,
  formatDate,
  h1,
  h3,
  p,
  rich,
  spacer,
  subtitle,
  table,
  title,
  writeDocx,
} from "./shared";

export async function generateVisualStyleGuide() {
  const doc = buildDocument([
    title("Visual Style Guide — Exercise Partner"),
    subtitle(`Last updated: ${formatDate()}   ·   Decided once — referenced by every UI deliverable`),

    h1("0. Design Principles"),
    rich(
      "The guiding idea is a **calm instrument**. This app is read in a gym: mid-set, one-handed, sometimes sweaty, often in poor light. Every visual decision is judged on whether it survives that context. Decoration that competes with the next number the user needs is a defect, not a flourish.",
    ),
    spacer(),
    bullet("Legible before beautiful. High contrast is not negotiable; nothing important is rendered in muted grey."),
    bullet("One accent colour. Teal means 'this is the thing to act on'. If everything is accented, nothing is."),
    bullet("Numbers are the interface. Weights, reps, timers and rest counts are the most-read elements — they get the largest, clearest treatment."),
    bullet("Dark mode is not an afterthought. Gyms are dim and phones are used at night; both themes are designed, not derived."),
    bullet("Generous targets. Nothing interactive is smaller than 44px; primary Workout Mode controls are 56px."),
    bullet("Honest states. Empty, loading and error states are designed alongside the success state, never bolted on."),

    h1("1. Colour Palette"),
    p(
      "Implemented as CSS custom properties in oklch (the shadcn/ui token convention already in globals.css). Hex values below are the sRGB equivalents for reference and design tooling.",
      { muted: true },
    ),

    h3("Neutrals — slate ramp"),
    p("Carries surfaces, borders and text in both themes.", { muted: true }),
    spacer(),
    table(
      ["Token", "Hex", "Use"],
      [
        ["neutral-50", "#F8FAFC", "Light theme page background"],
        ["neutral-100", "#F1F5F9", "Light theme raised surface, table header fill"],
        ["neutral-200", "#E2E8F0", "Light theme borders and dividers"],
        ["neutral-300", "#CBD5E1", "Disabled text on light; inactive muscle fill"],
        ["neutral-500", "#64748B", "Secondary/muted text (light theme)"],
        ["neutral-600", "#475569", "Icon default on light"],
        ["neutral-800", "#1E293B", "Dark theme raised surface"],
        ["neutral-900", "#0F172A", "Dark theme card surface; primary text on light"],
        ["neutral-950", "#020617", "Dark theme page background"],
      ],
      [22, 18, 60],
    ),

    h3("Brand accent — Signal Teal"),
    p(
      "The single accent. Used for primary actions, active navigation, focus rings, and primary-muscle emphasis. Shifted one step lighter in dark mode to hold contrast against near-black.",
      { muted: true },
    ),
    spacer(),
    table(
      ["Token", "Hex", "Use"],
      [
        ["teal-50", "#F0FDFA", "Selected-row tint, subtle badge background (light)"],
        ["teal-400", "#2DD4BF", "Hover state in dark theme"],
        ["teal-500", "#14B8A6", "Primary action in dark theme"],
        ["teal-600", "#0D9488", "Hover state in light theme (was the primary action until Epic N0)"],
        ["teal-700", "#0F766E", "Primary action in light theme — the --primary token"],
        ["teal-800", "#115E59", "Pressed state in light theme"],
      ],
      [22, 18, 60],
    ),
    spacer(),
    callout(
      "Corrected in Epic N0",
      "This section previously specified teal-600 as the light-theme primary and claimed AA compliance. It did not comply: white on teal-600 is 3.74:1, below the 4.5:1 floor. Primary is now teal-700 (5.47:1), teal-600 demoted to hover and teal-800 to pressed. muted-foreground was darkened to #5F6D82 for the same reason (4.34:1 → 4.80:1); the dark theme already passed at 5.71:1 and is unchanged. The lesson worth keeping: a contrast claim written into a style guide is not a measurement.",
    ),

    h3("Semantic"),
    p(
      "Each semantic colour carries five roles, not one. The missing tinted-surface role was the structural reason 49 hardcoded colours had accumulated across the app — there was no token for \"a faint success-coloured panel\", so screens invented one each time.",
      { muted: true },
    ),
    spacer(),
    table(
      ["Role", "Token suffix", "Use"],
      [
        ["Fill", "--success", "Solid background of a badge or button"],
        ["On-fill text", "--success-foreground", "Text placed on that solid fill"],
        ["On-surface text", "--success-text", "The colour when writing on a neutral or tinted background"],
        ["Tinted surface", "--success-subtle", "Faint background of a callout or panel"],
        ["Tinted border", "--success-border", "Border of that same panel"],
      ],
      [22, 30, 48],
    ),
    spacer(),
    table(
      ["Token", "Hex (fill)", "Meaning"],
      [
        ["success", "#16A34A", "Set logged, workout completed, personal record"],
        ["warning", "#D97706", "Unreviewed derived data; approaching a volume limit"],
        ["danger", "#DC2626", "Destructive actions, validation failures"],
        ["info", "#2563EB", "Neutral informational notices"],
      ],
      [22, 18, 60],
    ),
    spacer(),
    callout(
      "Accessibility",
      "Colour never carries meaning alone. Every semantic state pairs its colour with an icon or text label, so it survives colour-blindness and greyscale. Every -text token has been checked to pass AA on both neutral and tinted surfaces, in both themes — and the dark theme now has its own values rather than the light hex values copied across, which was the previous state.",
    ),

    h3("Muscle involvement ramp"),
    p(
      "Used by the muscle diagram and involvement badges. A single-hue ramp reads as intensity rather than as unrelated categories.",
      { muted: true },
    ),
    spacer(),
    table(
      ["Role", "Hex", "Notes"],
      [
        ["Primary", "#0D9488", "The muscle the exercise principally trains"],
        ["Secondary", "#5EEAD4", "Assisting muscles"],
        ["Stabiliser", "#99F6E4", "Stabilising involvement only"],
        ["Not involved", "#E2E8F0", "Light theme; #1E293B in dark theme"],
      ],
      [22, 18, 60],
    ),

    h1("2. Typography"),
    rich(
      "**Geist Sans** for all interface text and **Geist Mono** for numerics. Both are already wired into the scaffold. Mono for numbers is deliberate: tabular figures stop a running rest timer or a changing weight from shifting the layout as digits change width.",
    ),
    spacer(),
    table(
      ["Role", "Size / Line height", "Weight", "Use"],
      [
        ["Display", "36 / 40", "700", "Workout Mode current exercise name; session summary headline"],
        ["H1", "30 / 36", "600", "Page titles"],
        ["H2", "24 / 32", "600", "Section headings"],
        ["H3", "20 / 28", "600", "Card titles, exercise detail subsections"],
        ["Body Large", "18 / 28", "400", "Exercise instructions — the longest-read text in the app"],
        ["Body", "16 / 24", "400", "Default. Also the minimum for inputs, which prevents iOS zoom-on-focus"],
        ["Small", "14 / 20", "400", "Table cells, metadata, helper text"],
        ["Caption", "12 / 16", "500", "Uppercase, 0.05em tracking. Field labels and badges"],
        ["Metric", "48 / 52", "600", "Geist Mono. Weight and rep values in Workout Mode"],
        ["Timer", "64 / 64", "600", "Geist Mono, tabular. Rest countdown"],
      ],
      [16, 20, 12, 52],
    ),
    spacer(),
    bullet("Line length for instructional prose is capped around 70 characters for readability."),
    bullet("Sentence case everywhere except Caption. Title Case reads as marketing copy."),
    bullet("Never below 14px, and never below 16px for anything read during a workout."),

    h1("3. Spacing & Layout"),
    h3("Spacing scale"),
    p("4px base unit. Only these steps are used — arbitrary values are a smell.", { muted: true }),
    spacer(),
    table(
      ["Step", "Value", "Typical use"],
      [
        ["1", "4px", "Icon-to-label gap"],
        ["2", "8px", "Within a control; tight stacks"],
        ["3", "12px", "Card padding (mobile); form field internal"],
        ["4", "16px", "Default gap between related elements"],
        ["6", "24px", "Card padding (desktop); between form groups"],
        ["8", "32px", "Between sections within a page"],
        ["12", "48px", "Between major page regions"],
        ["16", "64px", "Page top/bottom padding on desktop"],
      ],
      [12, 16, 72],
    ),

    h3("Grid & breakpoints"),
    table(
      ["Breakpoint", "Min width", "Layout behaviour"],
      [
        ["base", "0", "Single column. Bottom tab navigation. Full-bleed cards"],
        ["sm", "640px", "Two-column exercise card grid"],
        ["md", "768px", "Sidebar filters appear; navigation moves to the top"],
        ["lg", "1024px", "Three-column card grid; exercise detail becomes two-column"],
        ["xl", "1280px", "Content max-width 1280px, centred"],
      ],
      [16, 16, 68],
    ),
    spacer(),
    bullet("Corner radius: 10px default (--radius), 6px for small controls, 16px for cards, full for pills and avatars."),
    bullet("Elevation is expressed with borders in light theme and with surface lightness in dark theme. Heavy drop shadows are avoided."),
    bullet("Mobile Workout Mode reserves the bottom third of the viewport for controls — the thumb-reachable zone."),

    h1("4. Core Component Patterns"),
    h3("Buttons"),
    table(
      ["Variant", "Appearance", "Use"],
      [
        ["Primary", "Solid teal, white text", "The one main action on a screen — Start workout, Log set, Save"],
        ["Secondary", "Neutral surface, 1px border", "Supporting actions — Cancel, Back, Duplicate"],
        ["Ghost", "Transparent, text only", "Low-emphasis and icon actions in dense rows"],
        ["Destructive", "Solid danger red", "Delete. Always behind a confirmation step"],
      ],
      [16, 30, 54],
    ),
    spacer(),
    bullet("Height 44px default, 56px for Workout Mode primary actions, 36px for compact table rows."),
    bullet("Every button has a visible focus ring: 2px teal-600 offset 2px."),
    bullet("Buttons that trigger async work show a spinner in place of their label and stay disabled until resolved — never a silent second submit."),

    h3("Forms & inputs"),
    bullet("Labels sit above inputs, always visible. Placeholder text is never used as a label."),
    bullet("Validation errors appear below the field in danger red with an icon, and the field border turns red."),
    bullet("Numeric entry during a workout uses steppers with large +/− targets alongside direct entry — tapping a tiny field mid-set is the failure case being designed against."),
    bullet("Required fields are marked; optional fields are not — most fields are optional in this app."),

    h3("Cards"),
    bullet("Exercise card: thumbnail (16:9), name, primary muscle badge, equipment badge, experience level. Entire card is one click target."),
    bullet("Workout card: name, exercise count, estimated duration, last-performed date, overflow menu."),
    bullet("Cards use 1px neutral-200 borders in light theme and neutral-800 surfaces in dark theme."),

    h3("Navigation"),
    bullet("Five destinations: Exercises, Workouts, Build, History, Profile."),
    bullet("Mobile: fixed bottom tab bar with icon and label. Desktop: top bar with the profile switcher on the right."),
    bullet("Workout Mode takes over the full screen and hides global navigation — leaving requires an explicit, confirmed exit."),

    h3("States"),
    table(
      ["State", "Treatment"],
      [
        ["Loading", "Skeletons matching the final layout's shape, not spinners. No layout shift on arrival"],
        ["Empty", "Icon, one-line explanation, and the action that resolves it. Never a bare 'No results'"],
        ["Error", "What failed in plain language, and a retry action. Never a raw stack trace or error code alone"],
        ["Unreviewed data", "Amber info icon with a tooltip explaining the value is rule-derived and correctable"],
      ],
      [18, 82],
    ),

    h1("4a. Shared Primitives"),
    p(
      "Added in Epic N1 so the patterns above are implemented once rather than re-hand-rolled per screen. Anything in src/components/ui is the canonical implementation; a screen composing its own version of one of these is a bug, and scripts/check-design-tokens.ts exists to catch the drift.",
      { muted: true },
    ),
    spacer(),
    table(
      ["Primitive", "Replaces", "Notes"],
      [
        ["PageHeader", "Hand-written h1 blocks", "Title, optional description and action slot at the 24px in-app title size"],
        ["Card", "Ad-hoc bordered divs", "The border/surface/radius combination from the Cards section above"],
        ["Field", "Label + input + error markup", "Enforces label-above and the error treatment in one place"],
        ["Callout", "Hand-tinted coloured boxes", "Uses the -subtle / -border / -text roles; the guidance card's green/yellow/blue boxes were the motivating case"],
        ["EmptyState", "Bare \"No results\" text", "Icon, explanation and resolving action, per the States table"],
        ["ErrorState", "Raw error text", "Plain-language failure plus retry"],
        ["DataTable", "Bespoke table markup", "Whole-row link targets with a real anchor retained for keyboard and screen-reader users"],
        ["Stat", "Inline numeric spans", "Pairs a label with a mono tabular figure so columns stay optically aligned"],
        ["ConfirmDialog", "Immediate destructive actions", "Item removal and archive both used to fire without confirmation"],
        ["NumberStepper", "Bare numeric inputs", "56px field plus 56px +/- buttons stepping by the plate increment (2.5 kg / 5 lb), still accepting direct typing — the Forms section had specified this since Epic A and nothing had implemented it until Epic N5"],
        ["Skeletons", "Spinners", "Layout-shaped loading states"],
      ],
      [18, 26, 56],
    ),
    spacer(),
    callout(
      "Enforcement",
      "npm run lint runs scripts/check-design-tokens.ts, which counts raw palette colours, off-scale text sizes and spacing, raw shadows, off-scale radii and gradients against a recorded baseline. The count may only go down. It started at 487 and is currently 209, with the profile, admin, onboarding and home surfaces still to convert. Note it is a textual check — it catches a hardcoded hex, not a design that is merely ugly.",
    ),

    h1("5. Tone & Voice"),
    rich(
      "The app is a **knowledgeable training partner**: direct, specific, and unsentimental. It never hypes, never shames, and never pretends to certainty it does not have.",
    ),
    spacer(),
    table(
      ["Principle", "Write this", "Not this"],
      [
        ["Second person, active", "Add your first exercise to get started", "Exercises may now be added by the user"],
        ["Specific over generic", "No exercises match dumbbell + shoulders", "No results found"],
        ["No hype or exclamation", "Workout complete. 18 sets logged", "Awesome job crushing it!!"],
        ["No shame or pressure", "Last trained 12 days ago", "You've been slacking — 12 days off!"],
        ["Honest about uncertainty", "Suggested alternative — check the setup before swapping", "Equivalent exercise"],
        ["Plain language for errors", "Couldn't save that set. Check your connection and retry", "Error 500: mutation failed"],
      ],
      [22, 39, 39],
    ),
    spacer(),
    callout(
      "On derived data",
      "Wherever the app shows something it inferred rather than sourced — muscle diagrams, substitution suggestions, estimated duration — the copy says so. Overstating confidence in a training context is a safety issue, not just a tone problem.",
    ),

    footer("Generated from scripts/docs/visual-style-guide.ts — regenerate with npm run docs"),
  ]);

  return writeDocx("VISUAL_STYLE_GUIDE.docx", doc);
}
