# Changelog

All notable changes to this project are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Next.js 16 scaffold (App Router, TypeScript, Tailwind CSS 4, ESLint).
- shadcn/ui initialised with Base UI primitives and Geist Sans/Mono.
- Core dependencies: Drizzle ORM with the `postgres` driver, Zod 4, dnd-kit,
  Recharts, lucide-react.
- Vitest with Testing Library and a jsdom environment; `cn` utility covered by
  unit tests including empty and falsy input cases.
- `npm run typecheck`, `npm test`, `npm run test:watch` and `npm run docs` scripts.
- Word deliverable generators in `scripts/docs/` producing `PROJECT_PLAN.docx`,
  `TECHNICAL_SPEC.docx`, `VISUAL_STYLE_GUIDE.docx`, `USER_GUIDE.docx` and
  `ENHANCEMENTS.docx` into the synced Drive project folder.
- Source spreadsheet vendored to `data/source/` so imports are reproducible.

### Notes

- The repository lives at `~/Code/exercise-partner`, deliberately outside Google
  Drive, so dependency and build output are not continuously synced.
- Playwright end-to-end testing is deferred to Epic H, when Workout Mode provides a
  flow worth testing end to end.
- 12 `npm audit` advisories are dev-only transitive dependencies; see README.
