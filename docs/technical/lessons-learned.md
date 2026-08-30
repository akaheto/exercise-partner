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
