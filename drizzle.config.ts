// Must match Next.js precedence (.env.local over .env) — see scripts/load-env.ts.
// This previously used plain "dotenv/config", which reads only .env and so
// only ever saw the local Postgres URL, never the Neon one the app and
// scripts/migrate.ts actually use. db:generate was silently diffing against
// the wrong database as a result (PROJECT_PLAN.docx section 4, assumption 49).
import "./scripts/load-env";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
