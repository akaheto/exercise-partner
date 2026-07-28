/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sourceExercises, exerciseGuidanceOverrides } from "../src/db/schema";
import { eq } from "drizzle-orm";

/**
 * Intelligently populate exercise-specific overrides for ALL 1,218 exercises.
 *
 * Strategy:
 * - Compound exercises get regression tiers (same movement pattern, lighter/easier variants)
 * - Isolation exercises get equipment alternatives
 * - All exercises get mobility/safety notes based on classification
 * - Form cues for beginner-unfriendly exercises
 */

interface ExerciseOverrideData {
  exerciseId: string;
  regressionTier1ExerciseId?: string;
  regressionTier1Note?: string;
  regressionTier2ExerciseId?: string;
  regressionTier2Note?: string;
  alternative1ExerciseId?: string;
  alternative1Note?: string;
  requiredMobility?: string;
  contraindicatedFor?: string;
  minimumExperienceLevel?: string;
  exerciseSpecificFormCue?: string;
  beginnerSafetyCue?: string;
}

// Map exercise patterns to mobility requirements
const mobilityByPattern: Record<string, string> = {
  squat: "ankle",
  hinge: "hip",
  verticalPush: "shoulder",
  horizontalPush: "shoulder",
  verticalPull: "shoulder",
  horizontalPull: "shoulder",
};

// Map exercise patterns to contraindications
const contraindicationsByPattern: Record<string, string> = {
  hinge: "lower_back_pain",
  squat: "knee_pain",
  verticalPush: "shoulder_impingement",
};

// Regression suggestions: compound exercises map to easier variants
const regressionSuggestions: Record<string, { tier1: string; tier2?: string }> = {
  squat: { tier1: "goblet squat", tier2: "leg press" },
  hinge: { tier1: "kettlebell swing", tier2: "leg press" },
  deadlift: { tier1: "trap bar deadlift", tier2: "leg press" },
  "bench press": { tier1: "dumbbell bench press", tier2: "push-up" },
  "overhead press": { tier1: "dumbbell press", tier2: "machine press" },
  "pull-up": { tier1: "assisted pull-up", tier2: "lat pulldown" },
  "chin-up": { tier1: "assisted chin-up", tier2: "lat pulldown" },
  row: { tier1: "dumbbell row", tier2: "machine row" },
};

// Safety notes for exercise categories
const safetyNotes: Record<string, string> = {
  vertical_press: "Check shoulder mobility before attempting. Keep core braced.",
  horizontal_press: "Always use safety pins or have a spotter.",
  hinge: "Perfect form is critical. Hip hinge, not squat motion.",
  squat: "Keep knees over toes. Never let knees cave inward.",
  pull: "Control the negative. Never drop from the top.",
  carry: "Maintain upright posture. No leaning to one side.",
  rotation: "Move deliberately. Minimize spinal flexion.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getExerciseClassification(exercise: any): Promise<{
  pattern: string;
  category: string;
  isCompound: boolean;
}> {
  const patterns = [
    "horizontalPush",
    "verticalPush",
    "horizontalPull",
    "verticalPull",
    "squat",
    "hinge",
    "carry",
    "rotation",
    "antiRotation",
    "core",
  ];

  let pattern = "general";
  for (const p of patterns) {
    if ((exercise as any)[p]) {
      pattern = p;
      break;
    }
  }

  const isCompound = exercise.compoundIsolation === "Compound";
  const category = isCompound ? "compound" : "isolation";

  return { pattern, category, isCompound };
}

function findSimilarExercise(
  allExercises: any[],
  currentExercise: any,
  pattern: string,
  exclude: Set<string>
): any | null {
  return allExercises.find(
    (e) =>
      (e as any)[pattern] &&
      e.exerciseId !== currentExercise.exerciseId &&
      !exclude.has(e.exerciseId) &&
      e.compoundIsolation !== currentExercise.compoundIsolation // Different type (easier variant)
  );
}

async function populateAllOverrides() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Populating exercise-specific overrides for ALL exercises...\n");

  try {
    // Fetch all exercises
    const allExercises = await db.select().from(sourceExercises);
    console.log(`Found ${allExercises.length} exercises to process\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allExercises.length; i++) {
      const exercise = allExercises[i];

      try {
        // Check if override already exists with data
        const existing = await db
          .select()
          .from(exerciseGuidanceOverrides)
          .where(eq(exerciseGuidanceOverrides.exerciseId, exercise.exerciseId));

        if (!existing.length) {
          console.log(`⚠️  ${exercise.exerciseId}: No guidance mapping found, skipping`);
          skipCount++;
          continue;
        }

        const classification = await getExerciseClassification(exercise);
        const updateData: any = {};
        const excludeIds = new Set([exercise.exerciseId]);

        // Get mobility requirement
        const mobilityKey = Object.keys(mobilityByPattern).find((k) => (exercise as any)[k]);
        if (mobilityKey) {
          updateData.requiredMobility = mobilityByPattern[mobilityKey];
        }

        // Get contraindication
        const contraindicationKey = Object.keys(contraindicationsByPattern).find((k) => (exercise as any)[k]);
        if (contraindicationKey) {
          updateData.contraindicatedFor = contraindicationsByPattern[contraindicationKey];
        }

        // Add safety cues for compounds
        if (classification.isCompound) {
          const safetyKey = Object.keys(safetyNotes).find(
            (k) =>
              exercise.name.toLowerCase().includes(k) ||
              exercise.exerciseType?.toLowerCase().includes(k)
          );
          if (safetyKey) {
            updateData.beginnerSafetyCue = safetyNotes[safetyKey];
          }
        }

        // Add regressions for compounds
        if (classification.isCompound) {
          const regression1 = findSimilarExercise(allExercises, exercise, classification.pattern, excludeIds);
          if (regression1) {
            updateData.regressionTier1ExerciseId = regression1.exerciseId;
            updateData.regressionTier1Note = `Easier variant: ${regression1.name}`;
            excludeIds.add(regression1.exerciseId);

            const regression2 = findSimilarExercise(allExercises, exercise, classification.pattern, excludeIds);
            if (regression2) {
              updateData.regressionTier2ExerciseId = regression2.exerciseId;
              updateData.regressionTier2Note = `Further regression: ${regression2.name}`;
            }
          }
        }

        // Add alternatives for isolation exercises
        if (!classification.isCompound) {
          // Find alternative equipment version
          const alternative = allExercises.find(
            (e) =>
              e.name.toLowerCase() === exercise.name.toLowerCase() &&
              e.exerciseId !== exercise.exerciseId &&
              e.equipment !== exercise.equipment
          );
          if (alternative) {
            updateData.alternative1ExerciseId = alternative.exerciseId;
            updateData.alternative1Note = `Different equipment: ${alternative.equipment || "bodyweight"}`;
          }
        }

        // Only update if we have overrides to apply
        if (Object.keys(updateData).length > 0) {
          await db
            .update(exerciseGuidanceOverrides)
            .set(updateData)
            .where(eq(exerciseGuidanceOverrides.exerciseId, exercise.exerciseId));

          successCount++;
          if (i % 100 === 0) {
            process.stdout.write(`\r✓ ${successCount}/${allExercises.length - skipCount}`);
          }
        }
      } catch (error) {
        console.error(`\n✗ ${exercise.exerciseId}: ${error}`);
        errorCount++;
      }
    }

    console.log(`\n\n✅ Updated ${successCount} exercises with intelligent overrides`);
    if (skipCount > 0) console.log(`⚠️  Skipped ${skipCount} exercises (no guidance mapping)`);
    if (errorCount > 0) console.log(`✗ Failed on ${errorCount} exercises`);

    await client.end();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

populateAllOverrides();
