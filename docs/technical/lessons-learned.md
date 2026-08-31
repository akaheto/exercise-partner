# Lessons Learned

Mistake log for Exercise Partner: real bugs shipped, wrong approaches
taken, conventions violated, or things the user had to correct — not
routine draft iteration. Written and checked via `/log-mistake`; see that
skill for the promotion rule (a second occurrence of the same category
requires an actual enforced check, not just another log entry).

## Template

```
### <short title>
- **Date**: YYYY-MM-DD
- **Category**: <e.g. data-integrity, generator-logic, auth, a11y, test-gap>
- **What happened**: <concrete description>
- **Root cause**: <why it happened, not just what>
- **Fix applied**: <what changed>
- **Promoted to enforcement?**: no — <why not> | yes → <location>
```

## Entries

### Treated "there's a design comment for this" as equivalent to "this is fine"
- **Date**: 2026-08-31
- **Category**: process / QA methodology
- **What happened**: asked to "walk the site" and find issues, I noticed
  Workout Mode showed a plain block-figure muscle diagram while the
  exercise detail page showed the real anatomical photo. I found the code
  comment documenting this as a deliberate Epic O decision (screen space
  during a mid-set screen) and reported it back as "not a bug, working as
  designed" — without asking whether that tradeoff was still wanted. The
  user pushed back: they were looking at the actual inconsistency in a
  real workout and wanted it fixed, comment or no comment. Once corrected,
  a second, more skeptical look at the same session's earlier work found
  a second instance of the identical pattern: the workout generator's
  Goal and Experience wizard steps were hardcoded rather than defaulted
  from the profile (unlike Equipment, which correctly did), and I had
  personally seen the mismatch live — "Guidance (Beginner • Strength)" on
  a workout generated for "intermediate level" — and rationalized it away
  as "probably intentional decoupling, not worth chasing" instead of
  reading the code.
- **Root cause**: a design rationale documented in a code comment or an
  earlier PROJECT_PLAN entry describes a decision that was made once, not
  a fact that's still true. Finding an explanation for a discrepancy and
  finding out whether that explanation is still wanted are different
  questions — I only did the first one, twice, on two unrelated features
  in the same session.
- **Fix applied**: Workout Mode now shows the same photo diagram as the
  exercise detail page (`MuscleDiagram` deleted, nothing else used it).
  `GeneratorWizard` now seeds Goal/Experience from the profile, matching
  Equipment. Both logged above and in CHANGELOG.md.
- **Promoted to enforcement?**: yes — when a live QA pass finds a visible
  inconsistency between two screens (not just "is this correct" but "do
  these two things agree with each other"), a comment explaining *why*
  they differ is not a reason to close the finding. Explain it back to
  the user as a decision point ("X and Y differ because of Z — still
  want it that way?") rather than silently resolving it as "working as
  intended." Also worth a broader pass: any other UI initial-state that
  should read from the profile but doesn't (grep for `useState<.*>\(` in
  components whose parent Server Component already fetches the profile
  for something else, the way generator-wizard's Equipment step did but
  Goal/Experience didn't) hasn't been done — this was found by re-reading
  two specific screens I'd already looked at, not a systematic sweep.

### Site login completely broken for a month — no code path ever set the session cookie
- **Date**: 2026-08-30
- **Category**: auth / regression
- **What happened**: `src/proxy.ts`'s middleware requires a `site_session`
  cookie for every route except `/login` and `/admin/login`. Commit
  `1806351` ("Implement login redesign...", 2026-07-30, built by Haiku
  4.5) replaced the working `SITE_PASSWORD` verification + cookie-setting
  logic with a profile-name+PIN form (`verifyProfile()`) that never sets
  that cookie. Every route in the app — including `/onboarding`, so not
  even a brand-new profile could be created — has redirected back to
  `/login` for anyone who wasn't already an admin, since that commit.
  Found during a requested product-wide evaluation, not a user report;
  confirmed live (direct navigation to `/onboarding` in production
  307-redirected to `/login`) and via git history (`ae45045` had the
  correct logic; `1806351` deleted it).
- **Root cause**: a redesign commit deleted an entire auth code path
  (site-password verification + `site_session` cookie) without replacing
  its function, and nothing caught it — `src/lib/auth.ts`'s
  `signSiteToken`/`verifySiteToken` stayed unit-tested in isolation the
  whole time (so `/code-audit` stayed green), but nothing tested that any
  *route* actually called them. The one e2e test that would have caught
  this (`e2e/workout-mode.spec.ts`, `page.getByLabel("Password")` on
  `/login`) was never updated for the redesign either, so it was already
  failing and apparently not being run/checked.
- **Fix applied**: restored `src/app/login/actions.ts`'s `login()` to
  verify `SITE_PASSWORD` and set `site_session`, rewritten with current
  design-system primitives (`Card`/`Field`/`Button`) rather than the
  pre-Epic-N raw classes the original had. Removed the profile-name+PIN
  login form entirely — profile selection already lives on `/`
  (`ProfileSelector`, Epic M2), which needs no separate credential per
  the documented architecture (`TECHNICAL_SPEC.docx`: one shared site
  password, PIN only for deletion). Verified via `npm run test:e2e`
  against production.
- **Promoted to enforcement?**: **yes** — this is exactly the kind of bug
  a real test-coverage gap allows: two consecutive things had to fail
  together (an auth code path deleted, and the one e2e test that would
  catch it going stale/unrun) for a month-long total outage to go
  unnoticed. Concretely: (1) `/code-audit` should be extended to run
  `npm run test:e2e` in CI or before any deploy touching `src/proxy.ts`,
  `src/lib/auth.ts`, or `src/app/login/**` — not just on request; (2) any
  future change to the login/auth flow should update or add an e2e
  assertion in the same commit, not leave one to silently rot.
- **Related, found but not fixed**: `e2e/admin-auth.spec.ts`'s "the
  correct site password and admin token do grant access" test uses
  `getByRole("heading", { name: "Profiles" })`, which is a substring,
  case-insensitive match — it now also matches the empty-state heading
  "No profiles yet" whenever the profiles table is empty (as it currently
  is, in production). Needs `exact: true` or a scoped locator. Separately,
  `n7-screenshots.spec.ts`, `pin-security.spec.ts`, and
  `workout-mode.spec.ts` all fail waiting for an "Add" button on
  `/profile`, because Epic P (in progress) redirects non-admins to
  `/my-profile` instead — these three specs still create their test
  profile the pre-Epic-P way and need updating to use `/` or `/onboarding`
  instead. Neither touched here since they're pre-existing and out of
  scope for this fix.

### N+1 queries in the admin profile-stats dashboard
- **Date**: 2026-08-30
- **Category**: db-efficiency
- **What happened**: `getAllProfilesWithStats()` in `src/db/queries/admin.ts`
  looped over every profile and issued 3 sequential `await`ed queries per
  profile (workout count, latest session, session count) — found during a
  requested product-wide reliability/efficiency evaluation, not a user
  report.
- **Root cause**: per-row queries written inline in a `for` loop instead of
  aggregate/grouped queries; nothing caught it because `src/db/queries/`
  has no test coverage (query functions need a live DB, unlike the pure
  `src/domain` layer — see `CLAUDE.md`'s architectural rules).
- **Fix applied**: replaced with 3 grouped queries (`GROUP BY profileId`,
  using `count()`/`max()`), run together via `Promise.all`, joined to the
  profile list in memory.
- **Promoted to enforcement?**: no — this is the first occurrence of this
  category. Worth a second look if another N+1 turns up in
  `src/db/queries/` later: at that point add a `/code-audit` or
  `/security-scan`-style grep for `for (... of ...)` blocks containing
  `await db.` as a mechanical check, since there's no test suite to catch
  this class of bug otherwise.
- **Related, not fixed**: `getProfileDetail()` in the same file has a
  `completedSessionCount` computed via `.filter((s) => s.id)`, which is a
  no-op (`id` is always truthy) — it's really just `sessionCount` again,
  and `totalVolume` is hardcoded to `0` with a `// Could be calculated if
  needed` comment. Not touched here since it wasn't part of what was
  asked; flagging so it isn't mistaken for correct.

### Design-token exclude silently broken on Windows
- **Date**: 2026-08-30
- **Category**: cross-platform / tooling
- **What happened**: `scripts/check-design-tokens.ts`'s `walk()` computed
  each file's path relative to the repo root with `path.relative()`, then
  compared it against `EXCLUDE_DIRS = ["src/components/ui"]` (forward
  slashes). On Windows, `path.relative()` returns backslash-separated
  paths, so the comparison never matched — the entire `src/components/ui`
  exclusion silently stopped working, and `npm run lint` falsely reported
  56 "regressions" (8 raw-palette-color, 22 raw-text-size, 26
  off-scale-spacing) in files that were supposed to be skipped.
- **Root cause**: OS-dependent path separator compared against a
  hardcoded forward-slash string, with no normalization.
- **Fix applied**: normalize the relative path to forward slashes before
  the exclude comparison (`rel.split(sep).join("/")`) in
  `scripts/check-design-tokens.ts`.
- **Promoted to enforcement?**: no — one-line root-cause fix already
  makes the check correct on any OS; nothing further to enforce. Worth
  watching for the same pattern (`path.relative()` compared against a
  forward-slash literal) elsewhere in `scripts/` if this repo is worked
  on from Windows again.
