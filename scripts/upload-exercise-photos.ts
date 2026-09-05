import "./load-env";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { put, list } from "@vercel/blob";
import postgres from "postgres";

/**
 * Uploads the 1,218 supplied photorealistic exercise photos (start/end
 * position, side by side) to their own Vercel Blob store
 * (exercise-partner-photos) and verifies the result. This is the
 * "Photorealistic exercise images" enhancement named in ENHANCEMENTS.docx —
 * previously deferred to the end of the project.
 *
 * Same matching approach as scripts/upload-muscle-diagrams.ts: filenames map
 * 1:1 onto exercise names (verified separately — zero unmatched, zero
 * ambiguous against the original 1,218-exercise set; the 53 later
 * Workout-Library-derived exercises, EX-9001+, have no photo and are simply
 * skipped, not treated as an error). The blob pathname uses exercise_id, not
 * the filename, for the same reason as the muscle diagrams: it's stable and
 * URL-safe where the filename has spaces, parentheses, ampersands, etc.
 *
 * Source files are JPEG; converted to WebP on the way up (matching the
 * muscle-diagram convention) rather than uploading JPEG as-is, both for
 * consistency and file size.
 *
 * exercise-partner-photos is this project's BLOB_READ_WRITE_TOKEN store
 * (the "primary" one, in Vercel's terms) — the muscle-diagrams store is the
 * one that had to move to its own MUSCLE_DIAGRAMS_BLOB_TOKEN, since it was
 * added second and Vercel's CLI always names the primary token
 * BLOB_READ_WRITE_TOKEN with no way to customise that per store. This
 * script relies on @vercel/blob's default env lookup rather than passing a
 * token explicitly.
 */

const SOURCE_DIR = "C:/Users/akahe/My Drive/Codex/Projects/2/exercise_images";
const BLOB_PREFIX = "exercise-photos";
const WEBP_QUALITY = 85;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not set");

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

  // Only top-level .jpg files — excludes the stray "-v2.png" comparison
  // render and the one empty leftover subfolder from generation.
  const files = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.toLowerCase().endsWith(".jpg"))
    .map((f) => f.name);
  console.log(`${files.length} local files, ${exercises.length} exercises in the database`);

  const plan: { file: string; exerciseId: string; pathname: string }[] = [];
  const unmatched: string[] = [];

  for (const file of files) {
    const base = path.basename(file, ".jpg");
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
    try {
      const jpeg = fs.readFileSync(filePath);
      const webp = await sharp(jpeg).webp({ quality: WEBP_QUALITY }).toBuffer();
      await put(pathname, webp, {
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
  // paginated the same way upload-muscle-diagrams.ts learned to: list()
  // caps a page at 1000, which under-reports on a set this size otherwise.
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
