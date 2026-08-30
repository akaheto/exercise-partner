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
