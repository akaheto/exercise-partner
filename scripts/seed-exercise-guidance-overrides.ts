import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sourceExercises } from "../src/db/schema/source";
import { exerciseGuidanceOverrides, guidancePatterns } from "../src/db/schema/app";

/**
 * Exercise guidance overrides: maps each exercise to a guidance pattern.
 *
 * Strategy:
 * - All exercises get a default pattern based on their movement category
 * - Patterns are reusable (15 total for 1,218 exercises)
 * - Exercise-specific overrides (regressions, alternatives, safety notes) layer on top
 *
 * This seed script populates 1,218 rows (one per exercise), each mapping to a pattern.
 * Future runs can selectively update specific exercises without rebuilding all 1,218.
 */

interface SourceExercise {
  exerciseId: string;
  compoundIsolation: string | null;
  horizontalPush: boolean;
  verticalPush: boolean;
  horizontalPull: boolean;
  verticalPull: boolean;
  squat: boolean;
  hinge: boolean;
  carry: boolean;
  rotation: boolean;
  antiRotation: boolean;
  core: boolean;
}

// Determine pattern based on exercise movement classification
// Priority order: strength compounds > compound lower body > isolation > rotational > core > general
function getDefaultPattern(exercise: SourceExercise): string {
  // Compound pushes and pulls: strength focus
  if (exercise.horizontalPush || exercise.verticalPush || exercise.horizontalPull || exercise.verticalPull) {
    return "beginner_strength";
  }

  // Compound lower body: strength focus
  if (exercise.squat || exercise.hinge || exercise.carry) {
    return "beginner_strength";
  }

  // Isolation: hypertrophy focus
  if (exercise.compoundIsolation === "Isolation") {
    return "beginner_hypertrophy";
  }

  // Rotation and anti-rotation: general focus (core/stability)
  if (exercise.rotation || exercise.antiRotation) {
    return "beginner_general";
  }

  // Core: general focus
  if (exercise.core) {
    return "beginner_general";
  }

  // Default fallback
  return "beginner_general";
}

async function seedExerciseGuidanceOverrides() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Seeding exercise guidance overrides...");

  try {
    // Fetch all exercises
    const exercises = await db.select().from(sourceExercises);
    console.log(`Found ${exercises.length} exercises to map to patterns`);

    // Fetch all patterns to validate they exist
    const patterns = await db.select().from(guidancePatterns);
    const patternIds = new Set(patterns.map(p => p.id));
    console.log(`Found ${patterns.length} guidance patterns`);

    // Map exercises to patterns based on their derived movement booleans
    const overridesToInsert = exercises
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((exercise: any) => {
        let patternId = getDefaultPattern(exercise);

        // Validate pattern exists
        if (!patternIds.has(patternId)) {
          console.warn(`⚠️  Pattern "${patternId}" for "${exercise.exerciseId}" not found, using beginner_general`);
          patternId = "beginner_general";
        }

        return {
          exerciseId: exercise.exerciseId,
          patternId,
        };
      });

    // Insert in batches to avoid connection issues
    const BATCH_SIZE = 100;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < overridesToInsert.length; i += BATCH_SIZE) {
      const batch = overridesToInsert.slice(i, i + BATCH_SIZE);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.insert(exerciseGuidanceOverrides).values(batch as any);
        successCount += batch.length;
        process.stdout.write(`\r✓ ${successCount}/${overridesToInsert.length}`);
      } catch (error) {
        failureCount += batch.length;
        console.error(`\n✗ Batch ${i / BATCH_SIZE + 1} failed:`, error);
      }
    }

    console.log(`\n✅ Added ${successCount} exercise guidance overrides`);
    if (failureCount > 0) {
      console.warn(`⚠️  Failed to add ${failureCount} rows`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("✗ Failed to seed exercise guidance overrides:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seedExerciseGuidanceOverrides();
