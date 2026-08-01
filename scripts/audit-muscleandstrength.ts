import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";
import { db } from "@/db/client";
import { sourceExercises } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

const CACHE_DIR = path.join(process.cwd(), ".exercise-index-cache");
const DELAY_MS = 500;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function slugFromUrl(url: string): string {
  return url
    .split("?")[0]
    .replace(/\/$/, "")
    .split("/")
    .pop()!
    .replace(/\.html$/i, "")
    .toLowerCase();
}

async function fetchHtml(url: string): Promise<string> {
  const cached = path.join(CACHE_DIR, "exercise-index.html");
  if (fs.existsSync(cached)) {
    return fs.readFileSync(cached, "utf-8");
  }

  console.log(`Fetching exercise index from ${url}...`);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  fs.writeFileSync(cached, html);
  await new Promise((r) => setTimeout(r, DELAY_MS));
  return html;
}

async function scrapeExerciseIndex(): Promise<Map<string, string>> {
  const html = await fetchHtml("https://www.muscleandstrength.com/exercises");
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const exercises = new Map<string, string>();

  // Find all exercise links - they're typically in a list or grid
  const links = doc.querySelectorAll('a[href*="/exercises/"]');
  console.log(`Found ${links.length} exercise links`);

  for (const link of links) {
    const href = link.getAttribute("href");
    const text = link.textContent?.trim();

    if (!href || !text) continue;
    if (href.includes("/exercises/") && !href.includes("/browse")) {
      const slug = slugFromUrl(href);
      if (slug && slug.length > 2) {
        exercises.set(slug, text);
      }
    }
  }

  return exercises;
}

async function auditLibrary() {
  console.log("Scraping muscleandstrength.com exercise index...\n");
  const msExercises = await scrapeExerciseIndex();
  console.log(`Found ${msExercises.size} exercises on muscleandstrength.com\n`);

  // Get all exercises from local database
  const localExercises = await db
    .select({ exerciseId: sourceExercises.exerciseId, url: sourceExercises.url })
    .from(sourceExercises)
    .where(isNotNull(sourceExercises.url));

  console.log(`Found ${localExercises.length} exercises in local database\n`);

  // Build set of local slugs
  const localSlugs = new Set<string>();
  for (const ex of localExercises) {
    if (ex.url) {
      const slug = slugFromUrl(ex.url);
      localSlugs.add(slug);
    }
  }

  // Find missing exercises
  const missing: Array<{ slug: string; name: string }> = [];
  for (const [slug, name] of msExercises.entries()) {
    if (!localSlugs.has(slug)) {
      missing.push({ slug, name });
    }
  }

  missing.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`${"=".repeat(70)}`);
  console.log(`MISSING EXERCISES: ${missing.length} exercises on M&S but not in your library`);
  console.log(`${"=".repeat(70)}\n`);

  for (const ex of missing.slice(0, 50)) {
    console.log(`- ${ex.name}`);
    console.log(`  https://www.muscleandstrength.com/exercises/${ex.slug}.html\n`);
  }

  if (missing.length > 50) {
    console.log(`... and ${missing.length - 50} more\n`);
  }

  console.log(`${"=".repeat(70)}`);
  console.log(`Coverage: ${localSlugs.size} / ${msExercises.size} (${Math.round((localSlugs.size / msExercises.size) * 100)}%)`);
  console.log(`${"=".repeat(70)}`);

  process.exit(0);
}

auditLibrary().catch((err) => {
  console.error(err);
  process.exit(1);
});
