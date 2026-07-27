# Exercise Partner

A personal exercise knowledge base and workout platform. It imports a 1,218-exercise
research spreadsheet as its seed database and builds four capabilities on top:

- **Exercise Library** — a searchable reference for learning movements correctly
- **Workout Builder** — manual building plus an intelligent generator
- **Workout Mode** — guided, one exercise at a time, with fast set logging
- **Workout History** — a permanent, immutable record of what was actually performed

## Status

Epics A–F (foundation, data import, app shell, exercise library, manual
workout builder, intelligent generator) are complete. Start at `/build`:
build a workout by hand, or answer 5 quick questions at `/build/generate`
and get one assembled for you — balanced across movement patterns, fitted to
your time budget, fully editable afterwards in the same builder. You can
also multi-select exercises straight from `/exercises` (with a live duration
tally) to build a workout in one action, and every workout gets a
deterministic assessment — muscles worked, a weight-selection tip, and a
recovery tip. Epic G (workout library) is partially complete: `/workouts`
lists every saved workout with name search, exercise count and estimated
duration per card, plus one-click duplicate and archive/restore; versioning
and tags/folders are deliberately deferred (see `PROJECT_PLAN.docx` section 4).
Epic H (Workout Mode) is complete: hit "Start" on any workout to run it
full-screen, one exercise at a time, with fast 56px set logging, a wall-clock
rest timer, and resume that survives closing the tab — progress is derived
from the sets you've already logged, not stored client-side. See
`PROJECT_PLAN.docx` for the current deliverable status.

The site is protected by a single shared password (`SITE_PASSWORD` in `.env`);
inside it, a lightweight profile picker (no per-person login) scopes workouts
and history to each person.

## Requirements

- Node.js 22+
- npm 10+
- PostgreSQL (Neon in production; local Postgres for development)

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, SESSION_SECRET, SITE_PASSWORD
npm run dev
```

The app runs at http://localhost:3000 (or the next free port — Next.js will tell
you if 3000 is taken by another project). You'll land on `/login`; enter the
`SITE_PASSWORD` you set in `.env`, then create a profile from the picker.

### Local database

Development uses a local Postgres via Homebrew rather than a hosted instance:

```bash
brew install postgresql@16
brew services start postgresql@16      # starts now and on login
createdb exercise_partner_dev
```

`.env` should then contain:

```
DATABASE_URL=postgres://<macos-username>@localhost:5432/exercise_partner_dev
```

Stop the service with `brew services stop postgresql@16` when not developing.
Production uses Neon (via the Vercel Marketplace) — see `TECHNICAL_SPEC.docx`.

Apply the schema and seed data:

```bash
npm run db:generate       # regenerate SQL migrations after a schema change
npm run db:migrate        # apply migrations to DATABASE_URL
npm run import:exercises  # import data/source/*.xlsx into the source tables
npm run db:report         # row counts and a sparse-field data-quality audit
```

`db:migrate` and `import:exercises` are both safe to re-run. Import upserts
`source_exercises`/`source_equipment`/`source_muscles` by natural key and fully
rebuilds the derived/relationship tables from the spreadsheet each time; it
never touches app-owned tables (profiles, workouts, sessions, etc.).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright end-to-end tests (starts its own dev server on port 3100) |
| `npm run docs` | Regenerate the Word deliverables |

Run `lint`, `typecheck` and `test` before considering any change complete.

## Project layout

```
data/source/     The source spreadsheet, vendored so imports are reproducible
scripts/docs/    Generators for the Word deliverables
src/app/         Next.js App Router routes
src/components/  UI components (shadcn/ui primitives in components/ui)
src/lib/         Shared utilities
```

Planned as feature work lands: `src/db` (Drizzle schema and queries) and
`src/domain` (pure business logic — generator, duration estimation, volume math).

## Documentation

The planning and design documents are Word files kept in the synced Google Drive
project folder, **not** in this repository:

`~/Library/CloudStorage/GoogleDrive-akaheto@gmail.com/My Drive/Claude/Code/Exercise Partner/`

| Document | Contents |
| --- | --- |
| `PROJECT_PLAN.docx` | Deliverables, status, assumptions, changelog |
| `TECHNICAL_SPEC.docx` | Architecture, data model, decisions, known risks |
| `VISUAL_STYLE_GUIDE.docx` | Palette, typography, spacing, components, UI voice |
| `USER_GUIDE.docx` | Non-technical guide for end users |
| `ENHANCEMENTS.docx` | Ideas: implemented, not yet implemented, rejected |

These are **generated** by `npm run docs`, not hand-edited. Editing them in Word
works until the next generation run overwrites the changes — change the scripts in
`scripts/docs/` instead.

`README.md` and `CHANGELOG.md` stay as markdown here, where tooling expects them.

## Architecture notes

The most important rule: **imported data and app-owned data never share a table.**

The spreadsheet import rebuilds its own source tables on every run and must never be
able to damage user data. User corrections live in a sparse override layer that is
merged over the source at read time, so re-importing an updated spreadsheet preserves
customisations while still picking up upstream improvements.

Business logic that makes judgement calls — workout generation, duration estimation,
substitution ranking — lives in `src/domain` as pure functions with no I/O, so it can
be tested without a database or a browser.

See `TECHNICAL_SPEC.docx` for the full picture.

## Known issues

`npm audit` reports 27 advisories (19 high, 8 moderate), all in transitive
dependencies of dev/build tooling — the ESLint toolchain (minimatch/glob chain),
`drizzle-kit`'s esbuild, `exceljs`'s zip-writer path (`archiver`), and PostCSS/`sharp`
pulled in by `next`. None are exercised by application code paths (the app only
reads spreadsheets, never writes zips; PostCSS runs at build time, not on user input).
Fixing most requires a breaking upgrade (ESLint 10, which `eslint-config-next` does
not yet support, is the main blocker). Revisit periodically as upstream fixes land.
