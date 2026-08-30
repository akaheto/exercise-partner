---
name: log-mistake
description: Records a real mistake (a bug shipped, wrong approach taken, convention violated, or something the user had to correct) to docs/technical/lessons-learned.md, checks whether this category has happened before, and promotes repeated categories into an enforced check instead of just re-documenting them. Use whenever you're corrected on something you got wrong, or catch a real mistake yourself — not for routine back-and-forth or first-draft iteration.
allowed-tools: Read, Edit, Write, Grep
---
This is the mechanism that makes "learn from mistakes" actually happen,
rather than being a wish. A note in `CLAUDE.md` that says "don't do X" is
easy to miss on any given session — a check that mechanically blocks X is
not. This skill's job is to move things from the first category to the
second whenever a pattern repeats.

When invoked:

1. **Write the entry.** Append to `docs/technical/lessons-learned.md`
   using its template: what happened, root cause, the fix applied,
   category. Be concrete — "workout duration estimator ignored per-set
   rest time," not "logic bug."

2. **Check for repeats.** Grep `lessons-learned.md` for the same
   category (and related keywords) among prior entries. This is a small
   file scanned on demand, not something that costs context by default.

3. **Decide: log-only, or promote?**
   - **First occurrence** of this category, genuinely one-off, or not
     mechanically checkable (a judgment call, not a pattern) → log it
     and stop there. Say explicitly why it isn't being promoted.
   - **Second occurrence of the same category** → promotion is not
     optional. Add an actual enforced check before doing anything else:
     - A recurring code-quality pattern → an ESLint rule in
       `eslint.config.mjs`, so it's caught mechanically, not by memory.
     - A recurring design/visual regression → a new check in
       `scripts/check-design-tokens.ts` (it already ratchets raw color/
       size usage down — extend it rather than adding a separate check).
     - A recurring security-relevant pattern → a new grep pattern in
       `.claude/skills/security-scan/scripts/scan.sh`.
     - A recurring process failure (skipped a step, wrong assumption
       about scope) → a line in this repo's root `CLAUDE.md`.
     - A recurring gap in coverage → a standing test in the relevant
       `*.test.ts` file or `e2e/`, not just a one-off fix.
     - Record what was promoted and where, back in the lessons-learned
       entry (`Promoted to enforcement? yes → <location>`).

4. **Report back** in one or two lines: what was logged, whether it was
   promoted, and to where. Don't pad this with narrative.

Don't use this for normal iteration — a first draft that gets refined
isn't a mistake. This is for things that were actually wrong: shipped
bugs, violated conventions, approaches the user had to correct, security
issues caught late. If you're unsure whether something qualifies, err
toward logging it — a slightly over-inclusive log is cheap; a missed
pattern that repeats a third time is not.
