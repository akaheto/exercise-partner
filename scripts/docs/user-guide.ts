import {
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

/** Placeholder for a section whose feature has not shipped yet. */
const pending = (epic: string) =>
  p(`Not available yet — this section will be written when ${epic} is built.`, {
    muted: true,
    italics: true,
  });

export async function generateUserGuide() {
  const doc = buildDocument([
    title("User Guide — Exercise Partner"),
    subtitle(`Last updated: ${formatDate()}   ·   Written for everyday use — no technical knowledge needed`),

    callout(
      "About this guide",
      "The app is still being built. Sections describing features that do not exist yet are marked as such rather than described as though they work. Each one is written properly as its feature ships.",
    ),

    h1("What this app is"),
    rich(
      "Exercise Partner is your personal training system. It does three things: it **teaches you exercises**, it **helps you build workouts**, and it **remembers everything you do** so you can see yourself getting stronger.",
    ),
    spacer(),
    p("It contains a library of over 1,200 exercises, each with instructions, coaching tips, muscle diagrams and a demonstration video. You can browse that library to learn a movement, pull exercises from it into your own workouts, or let the app build a workout for you by answering a few questions."),
    p("When you train, the app walks you through your workout one exercise at a time and records what you actually lifted. Over time that record becomes a history you can look back on, compare against, and export."),

    h2("Who can use it"),
    p("The site is private. You reach it with a single shared password. Once inside, everyone has their own profile — your workouts and your training history are yours, and switching profiles switches everything over to that person."),

    h1("Getting in"),
    pending("the password gate and profile switcher (Epic C)"),

    h1("Finding an exercise"),
    pending("the Exercise Library (Epic D)"),
    p("Will cover: searching by name, narrowing by muscle group, equipment, difficulty and other filters, and switching between the list and card views.", { muted: true }),

    h1("Learning how to do an exercise"),
    pending("the exercise detail page (Epic D)"),
    p("Will cover: reading the instructions and coaching tips, understanding the muscle diagram, watching the demonstration video, and finding alternative exercises when you cannot do the one you are looking at.", { muted: true }),

    h1("Building a workout yourself"),
    pending("the manual workout builder (Epic E)"),
    p("Will cover: starting a new workout, adding exercises, putting them in the order you want, setting how many sets and reps to do, grouping exercises together, and saving it.", { muted: true }),

    h1("Letting the app build a workout for you"),
    pending("the workout generator (Epic F)"),
    p("Will cover: answering the questions about your goal, how long you have, what you want to work and what equipment you can use — then reviewing, changing and saving what it suggests.", { muted: true }),

    h1("Doing a workout"),
    pending("Workout Mode (Epic H)"),
    p("Will cover: starting a workout, moving between exercises, recording what you lifted, using the rest timer, and picking up where you left off if you get interrupted.", { muted: true }),

    h1("Looking back at what you have done"),
    pending("Workout History (Epic I)"),
    p("Will cover: finding past workouts, comparing how you did over time, and saving a copy of your history to a file.", { muted: true }),

    h1("Common questions"),
    table(
      ["Question", "Answer"],
      [
        ["Do I need an account?", "No. There is one password for the whole site, then you pick your profile."],
        ["Can other people see my workouts?", "Anyone with the site password can switch to any profile, so treat it as private between the people you share the password with — not as a lock between them."],
        ["What happens if I change a workout I have already done?", "Nothing happens to your history. Past sessions record what you actually did at the time and never change afterwards."],
        ["What if I lose signal at the gym?", "Your progress is saved as you go. Full offline support is on the ideas list but is not built yet."],
        ["Can I use kilograms instead of pounds?", "Yes — it is a setting on your profile, and switching it will not distort your past records."],
        ["Where do the exercises come from?", "They were imported from a research spreadsheet compiled from Muscle & Strength. More sources can be added later."],
        ["Some exercise details look generic. Why?", "Not every exercise in the source data has complete information. Where a detail was worked out automatically rather than sourced, the app marks it so you know to treat it as a starting point."],
      ],
      [30, 70],
    ),

    h1("Getting help"),
    bullet("If something looks wrong in an exercise's details, it can be corrected — your correction is kept even when the exercise database is next updated."),
    bullet("If a video does not play, use the link to the original source page on the exercise's detail page."),

    footer("Generated from scripts/docs/user-guide.ts — regenerate with npm run docs"),
  ]);

  return writeDocx("USER_GUIDE.docx", doc);
}
