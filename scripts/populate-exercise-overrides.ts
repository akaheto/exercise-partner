import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { exerciseGuidanceOverrides } from "../src/db/schema/app";
import { eq } from "drizzle-orm";

/**
 * Exercise-specific overrides: regression tiers and equipment alternatives
 * for key compound movements.
 *
 * Targets ~30 most-used exercises that benefit from having progression/regression paths.
 * Each exercise may have 2-3 regression tiers and 1-2 equipment alternatives.
 */

interface ExerciseOverride {
  exerciseId: string;
  regressionTier1ExerciseId?: string;
  regressionTier1Note?: string;
  regressionTier2ExerciseId?: string;
  regressionTier2Note?: string;
  regressionTier3ExerciseId?: string;
  regressionTier3Note?: string;
  alternative1ExerciseId?: string;
  alternative1Note?: string;
  alternative2ExerciseId?: string;
  alternative2Note?: string;
  requiredMobility?: string;
  contraindicatedFor?: string;
  minimumExperienceLevel?: string;
  exerciseSpecificFormCue?: string;
  beginnerSafetyCue?: string;
}

const EXERCISE_OVERRIDES: ExerciseOverride[] = [
  // Barbell Back Squat
  {
    exerciseId: "EX-0153",
    regressionTier1ExerciseId: "EX-0142",
    regressionTier1Note: "Goblet squat: easier to control, better form feedback",
    regressionTier2ExerciseId: "EX-0143",
    regressionTier2Note: "Smith machine squat: guided path reduces stability demand",
    alternative1ExerciseId: "EX-0144",
    alternative1Note: "Dumbbell squat: easier to scale load",
    requiredMobility: "ankle",
    minimumExperienceLevel: "Beginner",
    beginnerSafetyCue: "Check ankle and hip mobility before attempting. Start with bodyweight.",
    exerciseSpecificFormCue: "Bar should rest on rear delts. Elbows slightly forward. Keep chest upright.",
  },
  // Barbell Bench Press
  {
    exerciseId: "EX-0002",
    regressionTier1ExerciseId: "EX-0076",
    regressionTier1Note: "Dumbbell bench press: allows greater range of motion, easier to scale",
    regressionTier2ExerciseId: "EX-0079",
    regressionTier2Note: "Incline push-ups: reduced load, improved leverage",
    regressionTier3ExerciseId: "EX-0078",
    regressionTier3Note: "Machine chest press: stabilized path, no balancing required",
    alternative1ExerciseId: "EX-0076",
    alternative1Note: "Dumbbell bench press: no barbell needed",
    requiredMobility: "shoulder",
    beginnerSafetyCue: "Always have a spotter or use safety bars. Never fail a rep in the hole.",
    exerciseSpecificFormCue: "Feet flat on bench. Shoulder blades retracted. Lower to chest level.",
  },
  // Barbell Deadlift
  {
    exerciseId: "EX-0050",
    regressionTier1ExerciseId: "EX-0048",
    regressionTier1Note: "Trap bar deadlift: more upright torso angle, safer spinal position",
    regressionTier2ExerciseId: "EX-0049",
    regressionTier2Note: "Romanian deadlift: focuses on hip hinge, reduces load",
    regressionTier3ExerciseId: "EX-0185",
    regressionTier3Note: "Sumo deadlift: reduced ROM, different mechanics",
    alternative1ExerciseId: "EX-0048",
    alternative1Note: "Trap bar deadlift: easier setup, safer loading",
    alternative2ExerciseId: "EX-0049",
    alternative2Note: "Romanian deadlift: lighter weight, hip-focused",
    contraindicatedFor: "lower_back_pain",
    minimumExperienceLevel: "Beginner",
    beginnerSafetyCue: "Perfect form is critical. Start light. Hip hinge, not squat motion.",
    exerciseSpecificFormCue: "Shins vertical over midfoot. Shoulders over bar. Chest up. Drive through heels.",
  },
  // Barbell Bent Over Row
  {
    exerciseId: "EX-0032",
    regressionTier1ExerciseId: "EX-0033",
    regressionTier1Note: "Dumbbell rows: unilateral, easier to control form",
    regressionTier2ExerciseId: "EX-0035",
    regressionTier2Note: "Machine row: stabilized path, no balance required",
    alternative1ExerciseId: "EX-0033",
    alternative1Note: "Dumbbell rows: scale load easily",
    alternative2ExerciseId: "EX-0037",
    alternative2Note: "T-bar row: similar hinge pattern, different grip",
    requiredMobility: "hip",
    beginnerSafetyCue: "Maintain spinal neutral throughout. Never pull with arms first.",
    exerciseSpecificFormCue: "Slight knee bend. Chest over knees. Pull to lower ribs. Elbows close.",
  },
  // Overhead Press
  {
    exerciseId: "EX-0011",
    regressionTier1ExerciseId: "EX-0012",
    regressionTier1Note: "Dumbbell press: allows greater ROM, easier to control",
    regressionTier2ExerciseId: "EX-0014",
    regressionTier2Note: "Machine overhead press: guided path, no core stability needed",
    regressionTier3ExerciseId: "EX-0013",
    regressionTier3Note: "Incline bench press: reduced pressing angle",
    alternative1ExerciseId: "EX-0012",
    alternative1Note: "Dumbbell press: asymmetries corrected",
    requiredMobility: "shoulder",
    minimumExperienceLevel: "Beginner",
    beginnerSafetyCue: "Must have adequate shoulder mobility. Avoid arching excessively.",
    exerciseSpecificFormCue: "Elbows slightly forward. Full lockout. Avoid dropping into shoulders.",
  },
  // Pull-up
  {
    exerciseId: "EX-0024",
    regressionTier1ExerciseId: "EX-0025",
    regressionTier1Note: "Assisted pull-up: reduce bodyweight with assistance",
    regressionTier2ExerciseId: "EX-0026",
    regressionTier2Note: "Negative pull-ups: eccentric-focused development",
    regressionTier3ExerciseId: "EX-0028",
    regressionTier3Note: "Lat pulldown: similar movement pattern, reduced load",
    alternative1ExerciseId: "EX-0027",
    alternative1Note: "Chin-ups: easier grip, supinated position",
    minimumExperienceLevel: "Intermediate",
    beginnerSafetyCue: "Start with negatives or assisted. Never kip early.",
  },
  // Chin-up
  {
    exerciseId: "EX-0027",
    regressionTier1ExerciseId: "EX-0025",
    regressionTier1Note: "Assisted chin-ups: reduce bodyweight with assistance",
    regressionTier2ExerciseId: "EX-0026",
    regressionTier2Note: "Negative chin-ups: eccentric-focused development",
    regressionTier3ExerciseId: "EX-0028",
    regressionTier3Note: "Lat pulldown: similar movement, reduced load",
    alternative1ExerciseId: "EX-0024",
    alternative1Note: "Pull-ups: harder grip, pronated position",
    minimumExperienceLevel: "Intermediate",
  },
  // Dumbbell Bench Press
  {
    exerciseId: "EX-0076",
    regressionTier1ExerciseId: "EX-0079",
    regressionTier1Note: "Incline push-ups: reduced load, bodyweight only",
    regressionTier2ExerciseId: "EX-0078",
    regressionTier2Note: "Machine chest press: stabilized path",
    alternative1ExerciseId: "EX-0002",
    alternative1Note: "Barbell bench press: symmetric loading",
    beginnerSafetyCue: "Keep dumbbells stable. Prevent excessive shoulder strain.",
    exerciseSpecificFormCue: "Elbows in slight position. Scapulae retracted. Full ROM.",
  },
  // Leg Press
  {
    exerciseId: "EX-0134",
    regressionTier1ExerciseId: "EX-0142",
    regressionTier1Note: "Goblet squat: free weight, natural mechanics",
    regressionTier2ExerciseId: "EX-0143",
    regressionTier2Note: "Smith machine squat: lighter setup",
    alternative1ExerciseId: "EX-0142",
    alternative1Note: "Goblet squat: dumbbell-based",
    beginnerSafetyCue: "Do not allow knees to cave inward. Keep knees over toes.",
  },
  // Dumbbell Rows
  {
    exerciseId: "EX-0033",
    regressionTier1ExerciseId: "EX-0035",
    regressionTier1Note: "Machine row: stabilized path",
    regressionTier2ExerciseId: "EX-0028",
    regressionTier2Note: "Lat pulldown: vertical pulling pattern",
    alternative1ExerciseId: "EX-0032",
    alternative1Note: "Barbell rows: bilateral movement",
  },
  // Barbell Squat (Front)
  {
    exerciseId: "EX-0152",
    regressionTier1ExerciseId: "EX-0142",
    regressionTier1Note: "Goblet squat: easier torso position",
    regressionTier2ExerciseId: "EX-0143",
    regressionTier2Note: "Smith machine: reduced core demand",
    alternative1ExerciseId: "EX-0142",
    alternative1Note: "Goblet squat: no equipment needed",
    requiredMobility: "ankle",
    beginnerSafetyCue: "Wrist mobility critical. Elbows must stay high.",
  },
];

async function populateOverrides() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Populating exercise-specific overrides...\n");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const override of EXERCISE_OVERRIDES) {
    try {
      const existing = await db
        .select()
        .from(exerciseGuidanceOverrides)
        .where(eq(exerciseGuidanceOverrides.exerciseId, override.exerciseId));

      if (existing.length === 0) {
        console.log(`⚠️  ${override.exerciseId}: No guidance mapping found, skipping`);
        skipCount++;
        continue;
      }

      // Build update object with only provided fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (override.regressionTier1ExerciseId)
        updateData.regressionTier1ExerciseId = override.regressionTier1ExerciseId;
      if (override.regressionTier1Note) updateData.regressionTier1Note = override.regressionTier1Note;
      if (override.regressionTier2ExerciseId)
        updateData.regressionTier2ExerciseId = override.regressionTier2ExerciseId;
      if (override.regressionTier2Note) updateData.regressionTier2Note = override.regressionTier2Note;
      if (override.regressionTier3ExerciseId)
        updateData.regressionTier3ExerciseId = override.regressionTier3ExerciseId;
      if (override.regressionTier3Note) updateData.regressionTier3Note = override.regressionTier3Note;
      if (override.alternative1ExerciseId)
        updateData.alternative1ExerciseId = override.alternative1ExerciseId;
      if (override.alternative1Note) updateData.alternative1Note = override.alternative1Note;
      if (override.alternative2ExerciseId)
        updateData.alternative2ExerciseId = override.alternative2ExerciseId;
      if (override.alternative2Note) updateData.alternative2Note = override.alternative2Note;
      if (override.requiredMobility) updateData.requiredMobility = override.requiredMobility;
      if (override.contraindicatedFor) updateData.contraindicatedFor = override.contraindicatedFor;
      if (override.minimumExperienceLevel)
        updateData.minimumExperienceLevel = override.minimumExperienceLevel;
      if (override.exerciseSpecificFormCue)
        updateData.exerciseSpecificFormCue = override.exerciseSpecificFormCue;
      if (override.beginnerSafetyCue) updateData.beginnerSafetyCue = override.beginnerSafetyCue;

      await db
        .update(exerciseGuidanceOverrides)
        .set(updateData)
        .where(eq(exerciseGuidanceOverrides.exerciseId, override.exerciseId));

      console.log(
        `✓ ${override.exerciseId}: Added regression tiers${override.alternative1ExerciseId ? " + alternatives" : ""}`
      );
      successCount++;
    } catch (error) {
      console.error(`✗ ${override.exerciseId}: ${error}`);
      errorCount++;
    }
  }

  console.log(`\n✅ Updated ${successCount} exercises with custom overrides`);
  if (skipCount > 0) console.log(`⚠️  Skipped ${skipCount} exercises (no guidance mapping)`);
  if (errorCount > 0) console.log(`✗ Failed on ${errorCount} exercises`);

  await client.end();
}

populateOverrides().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
