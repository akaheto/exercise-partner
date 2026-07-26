# Changelog

All notable changes to this project are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Drizzle schema for the full two-layer data model: source layer
  (`source_exercises`, `source_equipment`, `source_muscles`, `source_relationships`),
  derived layer (`exercise_muscles`, `exercise_equipment`, `exercise_links`), and
  app layer (`profiles`, `exercise_overrides`, `equipment_inventory`, `workouts`,
  `workout_blocks`, `workout_items`, `sessions`, `session_sets`) — 15 tables total.
- Idempotent import pipeline (`npm run import:exercises`) that reads the source
  spreadsheet via exceljs, upserts source data by natural key with hash-based
  change detection, and fully rebuilds the derived/relationship tables each run.
- Pure, unit-tested parsing helpers (`src/domain/importParsing.ts`) for the
  spreadsheet's Yes/No, comma-list, and `"label | url; ..."` conventions.
- Merged read model (`src/domain/mergeOverrides.ts` + `src/db/queries/exercises.ts`)
  layering per-field user corrections over source data at read time.
- Data-quality report (`npm run db:report`): row counts and a sparse-field audit.
- Local Postgres 16 (Homebrew) provisioned for development; migrations via
  `npm run db:generate` / `npm run db:migrate`.
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

### Fixed

- The spreadsheet's `"Not listed"` sentinel was being stored as literal text
  instead of SQL `NULL`, silently breaking `is not null` queries downstream.
  Normalised at import time.

### Notes

- The repository lives at `~/Code/exercise-partner`, deliberately outside Google
  Drive, so dependency and build output are not continuously synced.
- Playwright end-to-end testing is deferred to Epic H, when Workout Mode provides a
  flow worth testing end to end.
- 12 `npm audit` advisories are dev-only transitive dependencies; see README.
- exceljs was chosen over xlsx/SheetJS for reading the spreadsheet: exceljs's
  advisories are in an unused zip-writer path, while xlsx has unpatched CVEs
  directly in its read path.
- One muscle name in the source data ("Middle Back") isn't in the original
  Muscle Taxonomy sheet; the import pipeline auto-extends the taxonomy rather
  than dropping the data.
