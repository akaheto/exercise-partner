import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";
import { db } from "@/db/client";
import { sourceExercises } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

const CACHE_DIR = path.join(process.cwd(), ".ms-scrape-cache");
const DELAY_MS = 1000; // 1 second between requests to be respectful
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

function getCachePath(slug: string): string {
  return path.join(CACHE_DIR, `${slug}.html`);
}

async function fetchPage(url: string, slug: string): Promise<string> {
  const cached = getCachePath(slug);
  if (fs.existsSync(cached)) {
    console.log(`  [cached] ${slug}`);
    return fs.readFileSync(cached, "utf-8");
  }

  console.log(`  [fetching] ${url}`);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  fs.writeFileSync(cached, html);
  await new Promise((r) => setTimeout(r, DELAY_MS));
  return html;
}

interface Exercise {
  slug: string;
  name: string;
  url: string;
  category: string;
}

async function scrapeCategory(
  categoryName: string,
  categoryUrl: string
): Promise<Exercise[]> {
  try {
    const slug = slugFromUrl(categoryUrl);
    const html = await fetchPage(categoryUrl, slug);
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const exercises: Exercise[] = [];

    // Look for exercise links - typically in article listings or grids
    // Common patterns on M&S:
    // - Links in exercise cards/panels
    // - Links in lists
    // - Links with data attributes

    const links = doc.querySelectorAll(
      'a[href*="/exercises/"][href$=".html"], a[href*="/exercises/"][href*="exercise"]'
    );

    for (const link of links) {
      const href = link.getAttribute("href");
      const text = link.textContent?.trim();

      if (!href || !text) continue;

      // Skip category pages and non-exercise links
      if (
        href.includes("/browse") ||
        href.includes("/category") ||
        text.toLowerCase() === categoryName.toLowerCase()
      ) {
        continue;
      }

      const exSlug = slugFromUrl(href);
      if (exSlug && exSlug.length > 2 && exSlug !== slug) {
        const fullUrl = href.startsWith("http")
          ? href
          : new URL(href, "https://www.muscleandstrength.com").href;

        exercises.push({
          slug: exSlug,
          name: text,
          url: fullUrl,
          category: categoryName,
        });
      }
    }

    // Deduplicate by slug
    const unique = new Map<string, Exercise>();
    for (const ex of exercises) {
      if (!unique.has(ex.slug)) {
        unique.set(ex.slug, ex);
      }
    }

    return Array.from(unique.values());
  } catch (err) {
    console.error(`  Error scraping ${categoryName}: ${err}`);
    return [];
  }
}

async function deepScrape() {
  const categories = [
    "Abductors",
    "Abs",
    "Adductors",
    "Barbell Exercises",
    "Biceps",
    "Bodyweight Exercises",
    "Cable Exercises",
    "Calves",
    "Chest",
    "Compound Exercises",
    "Dumbbell Exercises",
    "Exercise Ball Exercises",
    "EZ Bar Exercises",
    "Forearms",
    "Glutes",
    "Hamstrings",
    "Hip Flexors",
    "Isolation Exercises",
    "IT Band",
    "Lats",
    "Lower Back",
    "Machine Exercises",
    "Neck",
    "Obliques",
    "Palmar Fascia",
    "Plantar Fascia",
    "Quads",
    "Shoulders",
    "Traps",
    "Triceps",
    "Upper Back",
  ];

  const allMissingExercises: Exercise[] = [];

  // Get local exercise slugs
  const localExercises = await db
    .select({ url: sourceExercises.url })
    .from(sourceExercises)
    .where(isNotNull(sourceExercises.url));

  const localSlugs = new Set<string>();
  for (const ex of localExercises) {
    if (ex.url) {
      localSlugs.add(slugFromUrl(ex.url));
    }
  }

  console.log(`\nScraped local database: ${localSlugs.size} unique exercise slugs\n`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Scraping ${categories.length} category pages from muscleandstrength.com`);
  console.log(`${"=".repeat(70)}\n`);

  for (const category of categories) {
    const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
    const categoryUrl = `https://www.muscleandstrength.com/exercises/${categorySlug}.html`;

    console.log(`\n📂 ${category}`);
    const exercises = await scrapeCategory(category, categoryUrl);
    console.log(`   Found ${exercises.length} exercises`);

    for (const ex of exercises) {
      if (!localSlugs.has(ex.slug)) {
        allMissingExercises.push(ex);
      }
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`DEEP SCRAPE COMPLETE`);
  console.log(`${"=".repeat(70)}\n`);

  console.log(`Total missing exercises: ${allMissingExercises.length}\n`);

  // Sort by category then name
  allMissingExercises.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  if (allMissingExercises.length > 0) {
    console.log(`${"=".repeat(70)}`);
    console.log(`MISSING EXERCISES BY CATEGORY`);
    console.log(`${"=".repeat(70)}\n`);

    let currentCategory = "";
    for (const ex of allMissingExercises) {
      if (ex.category !== currentCategory) {
        currentCategory = ex.category;
        console.log(`\n📂 ${currentCategory}`);
      }
      console.log(`  - ${ex.name}`);
      console.log(`    ${ex.url}\n`);
    }
  } else {
    console.log(`✅ Your library contains ALL exercises from muscleandstrength.com!\n`);
  }

  // Summary
  console.log(`\n${"=".repeat(70)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Local library: ${localSlugs.size} exercises`);
  console.log(`Found on M&S: ${allMissingExercises.length + localSlugs.size} exercises`);
  console.log(
    `Coverage: ${((localSlugs.size / (allMissingExercises.length + localSlugs.size)) * 100).toFixed(1)}%`
  );
  console.log(`Missing: ${allMissingExercises.length}`);
  console.log(`${"=".repeat(70)}\n`);

  process.exit(0);
}

deepScrape().catch((err) => {
  console.error(err);
  process.exit(1);
});
