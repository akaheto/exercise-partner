import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";
import { db } from "@/db/client";
import { sourceExercises } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

const CACHE_DIR = path.join(process.cwd(), ".ms-scrape-cache");
const DELAY_MS = 1000;
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
  url: string | null;
  hasLink: boolean;
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

    const exerciseMap = new Map<string, Exercise>();

    // Method 1: Extract linked exercises
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

        exerciseMap.set(exSlug, {
          slug: exSlug,
          name: text,
          url: fullUrl,
          hasLink: true,
          category: categoryName,
        });
      }
    }

    // Method 2: Extract text content from exercise containers
    // Look for common container patterns (divs, articles with data attributes or classes)
    const containers = doc.querySelectorAll(
      "[class*='exercise'], [class*='card'], [class*='item'], article, .list-item"
    );

    for (const container of containers) {
      const text = container.textContent?.trim();
      if (!text || text.length < 3) continue;

      // Get the first line (usually the exercise name)
      const firstLine = text.split("\n")[0].trim();

      if (
        firstLine.length > 3 &&
        firstLine.length < 100 &&
        !firstLine.match(/^\d+/) &&
        !firstLine.toLowerCase().includes("advertisement")
      ) {
        // Try to find a link within this container
        const link = container.querySelector('a[href*="/exercises/"]');
        const href = link?.getAttribute("href");

        if (href && href.includes("/exercises/") && href.endsWith(".html")) {
          const exSlug = slugFromUrl(href);
          if (exSlug && exSlug.length > 2 && !exerciseMap.has(exSlug)) {
            const fullUrl = new URL(href, "https://www.muscleandstrength.com").href;
            exerciseMap.set(exSlug, {
              slug: exSlug,
              name: firstLine,
              url: fullUrl,
              hasLink: true,
              category: categoryName,
            });
          }
        } else if (!href) {
          // No link found, but we have a name - this might be text-only exercise
          const cleanName = firstLine
            .replace(/\s+/g, " ")
            .replace(/[^\w\s-]/g, "")
            .trim();

          if (cleanName.length > 3 && cleanName.length < 100) {
            const pseudoSlug = cleanName.toLowerCase().replace(/\s+/g, "-");

            if (!exerciseMap.has(pseudoSlug)) {
              exerciseMap.set(pseudoSlug, {
                slug: pseudoSlug,
                name: firstLine,
                url: null,
                hasLink: false,
                category: categoryName,
              });
            }
          }
        }
      }
    }

    return Array.from(exerciseMap.values());
  } catch (err) {
    console.error(`  Error scraping ${categoryName}: ${err}`);
    return [];
  }
}

async function comprehensiveScrape() {
  const categories = [
    "Abductors",
    "Abs",
    "Adductors",
    "Biceps",
    "Calves",
    "Chest",
    "Forearms",
    "Glutes",
    "Hamstrings",
    "Lats",
    "Lower Back",
    "Neck",
    "Quads",
    "Shoulders",
    "Traps",
    "Triceps",
  ];

  const allExercises: Exercise[] = [];

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
  console.log(`Comprehensive scrape of ${categories.length} category pages`);
  console.log(`${"=".repeat(70)}\n`);

  for (const category of categories) {
    const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
    const categoryUrl = `https://www.muscleandstrength.com/exercises/${categorySlug}.html`;

    console.log(`\n📂 ${category}`);
    const exercises = await scrapeCategory(category, categoryUrl);
    console.log(`   Found ${exercises.length} exercises (${exercises.filter(e => e.hasLink).length} linked, ${exercises.filter(e => !e.hasLink).length} text-only)`);

    allExercises.push(...exercises);
  }

  // Find missing exercises
  const missing = allExercises.filter((ex) => !localSlugs.has(ex.slug));
  const found = allExercises.filter((ex) => localSlugs.has(ex.slug));

  console.log(`\n${"=".repeat(70)}`);
  console.log(`COMPREHENSIVE SCRAPE COMPLETE`);
  console.log(`${"=".repeat(70)}\n`);

  console.log(`Total found on M&S: ${allExercises.length}`);
  console.log(`  - With links: ${allExercises.filter(e => e.hasLink).length}`);
  console.log(`  - Text-only (no links): ${allExercises.filter(e => !e.hasLink).length}`);
  console.log(`\nLocal library: ${localSlugs.size}`);
  console.log(`Coverage: ${((found.length / allExercises.length) * 100).toFixed(1)}%`);
  console.log(`Missing: ${missing.length}\n`);

  if (missing.length > 0) {
    console.log(`${"=".repeat(70)}`);
    console.log(`MISSING EXERCISES (${missing.length})`);
    console.log(`${"=".repeat(70)}\n`);

    // Sort by whether they have links
    const missingWithLinks = missing.filter(e => e.hasLink);
    const missingWithoutLinks = missing.filter(e => !e.hasLink);

    if (missingWithLinks.length > 0) {
      console.log(`WITH LINKS (${missingWithLinks.length}):\n`);
      for (const ex of missingWithLinks) {
        console.log(`- ${ex.name} [${ex.category}]`);
        console.log(`  ${ex.url}\n`);
      }
    }

    if (missingWithoutLinks.length > 0) {
      console.log(`\nTEXT-ONLY / NO LINKS (${missingWithoutLinks.length}):\n`);
      for (const ex of missingWithoutLinks) {
        console.log(`- ${ex.name} [${ex.category}]`);
      }
    }
  } else {
    console.log(`✅ Your library contains ALL exercises from muscleandstrength.com!\n`);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`COVERAGE ANALYSIS`);
  console.log(`${"=".repeat(70)}`);
  console.log(`M&S exercises: ${allExercises.length}`);
  console.log(`Local library: ${localSlugs.size}`);
  console.log(`Coverage: ${((found.length / allExercises.length) * 100).toFixed(1)}%`);
  console.log(`Gap: ${missing.length} exercises`);
  console.log(`${"=".repeat(70)}\n`);

  process.exit(0);
}

comprehensiveScrape().catch((err) => {
  console.error(err);
  process.exit(1);
});
