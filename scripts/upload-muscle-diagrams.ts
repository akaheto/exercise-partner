import "./load-env";
import fs from "fs";
import path from "path";
import { put, list } from "@vercel/blob";
import postgres from "postgres";

/**
 * Uploads the 1,218 supplied muscle-diagram renders to Vercel Blob and
 * verifies the result — Epic O.
 *
 * Filenames map 1:1 onto exercise names (verified separately: zero
 * unmatched, zero ambiguous, zero duplicate names in the database), but the
 * blob pathname uses exercise_id rather than the filename: it's the stable,
 * URL-safe primary key, immune to a future exercise rename, where the
 * filename has spaces, parentheses and other characters that would need
 * escaping in every URL built from it.
 *
 * Uploaded with addRandomSuffix: false so the resulting URL is fully
 * deterministic — src/lib/muscle-diagram.ts constructs it from exerciseId
 * alone, with no per-exercise database column needed.
 */

const SOURCE_DIR =
  "/Users/benaheto/Library/CloudStorage/GoogleDrive-akaheto@gmail.com" +
  "/My Drive/Claude/Code/Exercise Partner/Images/Exercise_Muscle_Group_Diagrams_1218";

const BLOB_PREFIX = "muscle-diagrams";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const sql = postgres(process.env.DATABASE_URL!);
  const exercises = await sql<{ exercise_id: string; name: string }[]>`
    select exercise_id, name from source_exercises
  `;
  await sql.end();

  const byNormalizedName = new Map<string, { exercise_id: string; name: string }[]>();
  for (const e of exercises) {
    const key = normalize(e.name);
    if (!byNormalizedName.has(key)) byNormalizedName.set(key, []);
    byNormalizedName.get(key)!.push(e);
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".webp"));
  console.log(`${files.length} local files, ${exercises.length} exercises in the database`);

  const plan: { file: string; exerciseId: string; pathname: string }[] = [];
  const unmatched: string[] = [];

  for (const file of files) {
    const base = path.basename(file, ".webp");
    const matches = byNormalizedName.get(normalize(base));
    if (!matches || matches.length !== 1) {
      unmatched.push(file);
      continue;
    }
    const exerciseId = matches[0].exercise_id;
    plan.push({ file, exerciseId, pathname: `${BLOB_PREFIX}/${exerciseId}.webp` });
  }

  if (unmatched.length > 0) {
    console.error(`Refusing to proceed: ${unmatched.length} file(s) did not match exactly one exercise:`);
    for (const f of unmatched.slice(0, 20)) console.error(`  ${f}`);
    process.exit(1);
  }

  console.log(`${plan.length} files matched 1:1 to an exercise. Prefix: ${BLOB_PREFIX}/`);

  if (dryRun) {
    console.log("Dry run — nothing uploaded. Sample of the plan:");
    for (const p of plan.slice(0, 5)) console.log(`  ${p.file} -> ${p.pathname}`);
    return;
  }

  let uploaded = 0;
  let failed = 0;
  const startedAt = Date.now();

  for (const { file, pathname } of plan) {
    const filePath = path.join(SOURCE_DIR, file);
    const body = fs.readFileSync(filePath);
    try {
      await put(pathname, body, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/webp",
        allowOverwrite: true,
      });
      uploaded++;
    } catch (error) {
      failed++;
      console.error(`FAILED: ${file} -> ${pathname}:`, error);
    }
    if (uploaded % 100 === 0) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`  ${uploaded}/${plan.length} uploaded (${elapsed}s elapsed)`);
    }
  }

  console.log(`Done. Uploaded ${uploaded}, failed ${failed}, total planned ${plan.length}.`);

  // Verify against the store itself, not just "no exception was thrown" —
  // list() reads the actual current state of the blob store. Paginated:
  // list() caps a single page at 1000, so reading only the first page
  // under-reports on a set this size and looks like a data-loss false
  // alarm — confirmed and fixed after the first real run of this script.
  const pathnames = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `${BLOB_PREFIX}/`, cursor, limit: 1000 });
    for (const b of page.blobs) pathnames.add(b.pathname);
    cursor = page.cursor;
  } while (cursor);

  console.log(`Blob store now reports ${pathnames.size} objects under ${BLOB_PREFIX}/.`);
  if (pathnames.size !== plan.length) {
    console.error(
      `MISMATCH: expected ${plan.length} objects in the store, found ${pathnames.size}. Investigate before trusting this upload.`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
