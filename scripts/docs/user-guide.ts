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

export async function generateUserGuide() {
  const doc = buildDocument([
    title("User Guide — Exercise Partner"),
    subtitle(`Last updated: ${formatDate()}   ·   Written for everyday use — no technical knowledge needed`),

    callout(
      "About this guide",
      "Everything described here is built and working. Where something is only partly done, or is not as solid as it sounds, this guide says so rather than glossing over it — you should not have to discover a limitation by hitting it.",
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
    p("Go to the site. You will see a login screen split into two sections:"),
    bullet("Returning users: Enter your profile name and PIN to log back in."),
    bullet("New users: Click to go through the onboarding process to create a new profile."),
    spacer(),
    p("Once logged in, you will stay signed in on that device. Your profile is what keeps your workouts and your training history separate from everyone else's. You can switch profiles at any time from My Profile at the top right on a computer, or from the My Profile tab on a phone."),

    h2("Setting up your profile the first time"),
    p("Creating a profile walks you through four short steps:"),
    bullet("Your name — just what you want to be called."),
    bullet("Your experience level — beginner, intermediate or advanced."),
    bullet("Your training goal — strength, muscle size, endurance, power, or general fitness."),
    bullet("A PIN — four to six digits."),
    spacer(),
    p("The experience level and goal are not just labels. They change the sets, reps and effort level the app suggests on every exercise page, so answer them honestly rather than aspirationally. You can change both later from your profile."),
    p("The PIN is asked for when someone tries to delete your profile. It is there to stop an accidental or casual deletion of your training history by someone else using the same shared password. Pick something you will remember — there is currently no way to reset a forgotten PIN yourself."),

    h1("Finding an exercise"),
    p("The Exercises tab lists the whole library. Type in the search box to find something by name, or use the filters to narrow it down — by muscle group, equipment you have, difficulty, exercise type and several others. You can combine filters, and the app tells you which ones are active if a search comes back empty."),
    p("You can switch between a compact list and a card view with pictures, whichever you prefer. Your filters stay in the web address, so you can bookmark a particular view or send it to someone."),
    p("If you want to build a workout from what you are looking at, you can tick several exercises as you browse. A running total shows how long that workout would take, and it survives changing filters, so you can gather exercises from several searches before turning them into a workout in one click."),

    h1("Learning how to do an exercise"),
    p("Every exercise has its own page with:"),
    bullet("Step-by-step instructions and the starting position."),
    bullet("Coaching tips and common mistakes to avoid."),
    bullet("A demonstration video."),
    bullet("A muscle diagram showing what the movement works, with the main muscles picked out from the assisting ones."),
    bullet("Suggested sets, reps and effort level based on your experience level and goal."),
    bullet("Easier versions to fall back on, and alternatives if you do not have the equipment."),
    spacer(),
    callout(
      "How much to trust what you read",
      "Instructions and videos come from a real training source. But some details — the muscle diagrams, and the suggestions for which exercises substitute for which — were worked out automatically rather than checked by a person. Anywhere that is true, the app marks it. Treat those as a sensible starting point, not as gospel, and stop if a movement hurts.",
    ),
    p("The depth varies. About twenty exercises have detailed, movement-specific tips written for them; the rest fall back to more general coaching for your level and goal. If something looks wrong, it can be corrected, and your correction survives the next time the exercise database is updated."),

    h1("Building a workout yourself"),
    p("From the Build tab, choose to start from scratch. That creates an empty workout and opens the builder."),
    bullet("Add exercises with the search box. Each one becomes its own block."),
    bullet("Set how many sets, what rep range, and how long to rest for each exercise. Changes save on their own as you go — there is no Save button to forget."),
    bullet("Drag the handle on the left to reorder. This works with the keyboard too, not only the mouse."),
    bullet("To superset or circuit two exercises, add one into another's block; the block relabels itself automatically."),
    bullet("If you cannot do an exercise, use Substitute to swap it for a comparable one without losing your sets and reps."),
    spacer(),
    p("A running estimate of how long the workout will take updates as you change things. It is a calculation, not a measurement, so treat it as a guide."),

    h1("Letting the app build a workout for you"),
    p("From the Build tab, choose to generate one instead. You answer five questions: your goal, how long you have, what you want to focus on, your experience level, and which equipment you can actually use."),
    p("The app then picks a balanced set of exercises — the big compound movements first, then accessory work — and fits them into the time you gave it."),
    callout(
      "Why you sometimes get fewer exercises than expected",
      "Rest is part of the time budget. A 40-minute strength workout rests much longer between sets than a 40-minute muscle-building one, so it genuinely fits fewer exercises. That is the estimate being honest, not the app short-changing you.",
    ),
    p("What it generates opens straight into the normal builder, so you can change anything you disagree with before saving. Your equipment answers are remembered for next time."),

    h1("Using packaged workout programs"),
    p("From the Build tab, you can also browse programs from Muscle & Strength — pre-made multi-day workout plans. Pick one, choose how many days per week you want to train, and click Add to Your Workouts."),
    p("The app creates one workout for each training day, with all the exercises pre-loaded and prescribed. You can edit, substitute or delete exercises just like a manually built workout."),

    h1("Doing a workout"),
    p("Press Start on any workout. The screen changes to Workout Mode — one exercise at a time, large controls, and the normal navigation hidden so nothing is in your way mid-set."),
    bullet("The instructions, video and muscle diagram for the current exercise are right there if you need a reminder."),
    bullet("Enter your weight and reps and press Log. The buttons either side step the weight up and down by a sensible amount, so you can use them one-handed without aiming at a small box."),
    bullet("Logged the wrong thing? Undo puts it back."),
    bullet("A rest timer starts between sets, and you can skip it."),
    bullet("To leave early, use the X. It asks you to confirm, so you cannot lose a session by mis-tapping."),
    spacer(),
    p("If you get interrupted — a phone call, the screen locking, closing the tab by accident — just reopen the workout. It picks up at the exact next set, because it works that out from what you have already logged rather than remembering where you were. The one thing that does not survive is a running rest timer; you will simply see the next set ready to go."),
    p("The rest timer also stays accurate if you switch apps, so backgrounding your phone will not make it drift."),

    h1("Looking back at what you have done"),
    p("The History tab lists every session, most recent first. Anything you left unfinished links back so you can resume it."),
    bullet("Open a session to see every set you logged, exercise by exercise."),
    bullet("Once you have more than a week of training, a chart shows your total volume week by week."),
    bullet("A muscle balance panel ranks which muscles you have trained most over the last four weeks. It reports what happened — it does not tell you what to do about it."),
    bullet("Each exercise page gains a Your history panel showing how your top set has moved over time."),
    bullet("Each workout shows the past sessions run from that particular workout."),
    spacer(),
    p("You can download your complete history as a spreadsheet (CSV) or a data file (JSON) — every set of every session, not a summary."),
    callout(
      "One thing to watch",
      "Volume totals now automatically convert kilograms and pounds so mixed-unit histories stay accurate. If you logged sets in pounds and then switch to kilograms (or vice versa), totals that span both will still be meaningful — the app will compute them correctly.",
    ),
    p("Editing a workout never changes your history. Each session records what you actually did at the time and is fixed from then on."),

    h1("If you look after the site"),
    p("There is an admin area at /admin for whoever runs the site. Access it with the site password and a separate admin token. The admin area has:"),
    bullet("Profiles — a list of every profile with stats, and the ability to delete one without needing that profile's PIN."),
    bullet("Errors — a log of any technical errors that happen on the site, with the exact time and message, so you can spot and fix problems."),
    bullet("Enhancements — a roadmap of planned features, grouped by status."),
    bullet("Changelog — a record of what has changed with each update."),
    spacer(),
    callout(
      "Not yet safe to rely on",
      "The admin area's protection is currently weak enough that anyone who already has the site password could get past it if they went looking. Since that is everyone you have shared the site with, do not treat the admin token as a real barrier between users, and do not put the site on the public internet until this is fixed. It is recorded as a known issue and is the next security job.",
    ),

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
