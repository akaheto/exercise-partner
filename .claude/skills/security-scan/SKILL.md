---
name: security-scan
description: Fast first-pass security check for this repo — hardcoded-secret patterns, npm dependency vulnerabilities (npm audit), and common unsafe patterns in TypeScript/React. Use before committing or as part of definition of done. Not a replacement for a real SAST/secret scanner.
allowed-tools: Bash, Read, Grep
argument-hint: [path]
---
Run `scripts/scan.sh` with the optional path argument (defaults to the
whole repo). It checks, in order:

1. **Secret-like patterns** — grep across TS/JS, env, and config files
   for common credential shapes. Heuristic first pass, not a real secret
   scanner — it will miss things a dedicated tool catches.
2. **`npm audit`** — known dependency vulnerabilities.
3. **Unsafe frontend patterns** — `dangerouslySetInnerHTML`, `eval(`.

Report format:
- **Findings**: `file:line` plus a one-line reason, grouped by category
- **Severity**: flag secrets and `eval(` as high priority;
  `dangerouslySetInnerHTML` and dependency CVEs at whatever severity
  `npm audit` reports
- If clean, say so in one line

If this finds a likely real secret, stop and tell the person directly —
don't keep working past it, and don't try to remove or rewrite it
yourself without asking; they may need to rotate the credential first.
This matters more than usual here: `ADMIN_TOKEN` and the site password
gate the whole app (see `CLAUDE.md` and `src/proxy.ts`) and profile PINs
protect per-person data (`src/lib/pin.ts`) — treat anything touching
those as high priority regardless of what category it falls under.

For anything beyond this fast pass — real SAST, dependency graph
analysis — recommend a dedicated tool (e.g. Snyk, Anthropic's bundled
`security-guidance`/`claude-security` plugins) rather than trying to
extend this script into one.
