import * as fs from "fs";
import * as path from "path";
import { db } from "../src/db/client";
import { curationStatus, exerciseOverrides, sourceExercises } from "../src/db/schema";
import { eq } from "drizzle-orm";

const CACHE_DIR = path.join(process.cwd(), ".curate-cache");
const BATCH_SIZE = 10;
const DELAY_MS = 1000; // 1 second between requests

interface ExercisePage {
  exercise_id: string;
  name: string;
  url: string;
  instructions: string | null;
  starting_position: string | null;
  error?: string;
}

// Ensure cache dir exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCacheFile(exerciseId: string): string {
  return path.join(CACHE_DIR, `${exerciseId}.json`);
}

async function fetchExercisePage(
  url: string,
  exerciseId: string
): Promise<ExercisePage | null> {
  const cacheFile = getCacheFile(exerciseId);

  // Check cache first
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
  }

  try {
    console.log(`Fetching ${exerciseId} from ${url}...`);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse instructions and starting position
    const instructions = extractInstructions(html);
    const starting_position = extractStartingPosition(html, instructions);

    const result: ExercisePage = {
      exercise_id: exerciseId,
      name: url.split("/").pop() || "",
      url,
      instructions,
      starting_position,
    };

    // Cache the result
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    const result: ExercisePage = {
      exercise_id: exerciseId,
      name: url.split("/").pop() || "",
      url,
      instructions: null,
      starting_position: null,
      error: String(error),
    };
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    return result;
  }
}

function extractInstructions(html: string): string | null {
  // Look for the step-by-step instructions in the page
  // Common patterns: <ol> with numbered steps, or sections labeled "instructions" or "execution"

  // Try to find <ol> (ordered list) which typically contains numbered steps
  const olMatch = html.match(
    /<ol[^>]*>([\s\S]*?)<\/ol>/i
  );
  if (olMatch) {
    const olContent = olMatch[1];
    const steps: string[] = [];
    const liMatches = olContent.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);

    for (const match of liMatches) {
      const stepText = match[1]
        .replace(/<[^>]+>/g, "") // Remove HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();

      if (stepText) {
        steps.push(stepText);
      }
    }

    if (steps.length > 0) {
      return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    }
  }

  // Fallback: look for strong/bold headers like "Instructions" followed by content
  const instructionsMatch = html.match(
    /<h[2-4][^>]*>\s*(?:Instructions|Execution|Steps)\s*<\/h[2-4]>([\s\S]*?)(?=<h[2-4]|<\/main|<\/section|$)/i
  );
  if (instructionsMatch) {
    const content = instructionsMatch[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&[a-z]+;/g, "")
      .trim()
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    if (content && content.length > 20) {
      return content;
    }
  }

  return null;
}

function extractStartingPosition(html: string, instructions: string | null): string | null {
  // Look for "Starting Position", "Setup", "Starting Setup", etc.
  const patterns = [
    /<h[2-4][^>]*>\s*(?:Starting Position|Setup|Starting Setup)\s*<\/h[2-4]>([\s\S]*?)(?=<h[2-4]|<\/main|<\/section|$)/i,
    /<strong[^>]*>\s*(?:Starting Position|Setup)\s*<\/strong>([\s\S]*?)(?=<(?:strong|h[2-4])|<\/main|$)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const content = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&[a-z]+;/g, "")
        .trim()
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(" ");

      if (content && content.length > 10) {
        return content;
      }
    }
  }

  // Fallback: if instructions exist, use the first 1-2 steps as starting position
  // (most exercises describe initial positioning in the first 1-2 steps)
  if (instructions) {
    const steps = instructions.split(/\n/).filter((s) => s.trim());
    if (steps.length >= 1) {
      const startingSteps = steps.slice(0, Math.min(2, steps.length)).join(" ");
      if (startingSteps.length > 10) {
        return startingSteps;
      }
    }
  }

  return null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function curateBatch(
  exercises: Array<{ exercise_id: string; name: string; url: string | null }>
): Promise<void> {
  const results: ExercisePage[] = [];

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex.url) {
      console.log(`${ex.exercise_id} (${ex.name}): no URL`);
      continue;
    }

    const page = await fetchExercisePage(ex.url, ex.exercise_id);
    if (page) {
      results.push(page);
    }

    if (i < exercises.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Now save results to database
  console.log(
    `\nProcessing ${results.length} results for database insertion...`
  );

  for (const result of results) {
    try {
      // Update curation_status
      const hasError = !!result.error;

      if (result.instructions) {
        // Insert or update exercise_override for instructions
        const existing = await db
          .select()
          .from(exerciseOverrides)
          .where(
            eq(exerciseOverrides.exerciseId, result.exercise_id)
          )
          .limit(1);

        if (
          existing.length === 0 ||
          !existing.find((e) => e.field === "instructions")
        ) {
          await db.insert(exerciseOverrides).values({
            exerciseId: result.exercise_id,
            profileId: null, // Global override
            field: "instructions",
            value: result.instructions,
          });
        }

        await db
          .update(curationStatus)
          .set({
            instructionsStatus: "approved",
            instructionsSource: "muscleandstrength_scraped",
            instructionsFetchedAt: new Date(),
            instructionsFetchError: null,
            updatedAt: new Date(),
          })
          .where(eq(curationStatus.exerciseId, result.exercise_id));

        console.log(`✓ ${result.exercise_id}: instructions saved`);
      } else if (hasError) {
        await db
          .update(curationStatus)
          .set({
            instructionsStatus: "fetch_failed",
            instructionsFetchError: result.error,
            instructionsFetchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(curationStatus.exerciseId, result.exercise_id));

        console.log(`✗ ${result.exercise_id}: fetch error - ${result.error}`);
      } else {
        await db
          .update(curationStatus)
          .set({
            instructionsStatus: "needs_review",
            instructionsSource: "muscleandstrength_not_parsed",
            instructionsFetchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(curationStatus.exerciseId, result.exercise_id));

        console.log(`? ${result.exercise_id}: instructions not parsed`);
      }

      if (result.starting_position) {
        const existing = await db
          .select()
          .from(exerciseOverrides)
          .where(
            eq(exerciseOverrides.exerciseId, result.exercise_id)
          )
          .limit(1);

        if (
          existing.length === 0 ||
          !existing.find((e) => e.field === "starting_position")
        ) {
          await db.insert(exerciseOverrides).values({
            exerciseId: result.exercise_id,
            profileId: null,
            field: "starting_position",
            value: result.starting_position,
          });
        }

        await db
          .update(curationStatus)
          .set({
            startingPositionStatus: "approved",
            startingPositionSource: "muscleandstrength_scraped",
            startingPositionFetchedAt: new Date(),
            startingPositionFetchError: null,
            updatedAt: new Date(),
          })
          .where(eq(curationStatus.exerciseId, result.exercise_id));

        console.log(`✓ ${result.exercise_id}: starting_position saved`);
      } else if (hasError) {
        await db
          .update(curationStatus)
          .set({
            startingPositionStatus: "fetch_failed",
            startingPositionFetchError: result.error,
            startingPositionFetchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(curationStatus.exerciseId, result.exercise_id));
      } else {
        await db
          .update(curationStatus)
          .set({
            startingPositionStatus: "needs_review",
            startingPositionSource: "muscleandstrength_not_parsed",
            startingPositionFetchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(curationStatus.exerciseId, result.exercise_id));

        console.log(
          `? ${result.exercise_id}: starting_position not parsed`
        );
      }
    } catch (error) {
      console.error(
        `Error saving ${result.exercise_id}:`,
        error
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const maxBatches = args[0] ? parseInt(args[0], 10) : Infinity;

  // Get all exercises that need curation
  const exercises = await db
    .select({
      exercise_id: sourceExercises.exerciseId,
      name: sourceExercises.name,
      url: sourceExercises.url,
    })
    .from(sourceExercises)
    .limit(maxBatches * BATCH_SIZE);

  console.log(`\nFound ${exercises.length} exercises to curate`);

  let batchCount = 0;

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    if (batchCount >= maxBatches) break;

    const batch = exercises.slice(i, i + BATCH_SIZE);
    console.log(
      `\n=== Batch ${batchCount + 1} (${batch.length} exercises) ===`
    );

    await curateBatch(batch);
    batchCount++;

    if (batchCount < Math.ceil(exercises.length / BATCH_SIZE)) {
      console.log("\nWaiting before next batch...");
      await sleep(2000);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
