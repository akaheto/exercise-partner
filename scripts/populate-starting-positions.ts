import { db } from "../src/db/client";
import { exerciseOverrides, sourceExercises } from "../src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Populate exercise-specific starting positions for all exercises.
 * Uses exercise classification (movement patterns, body position, mechanics)
 * to generate appropriate, exercise-specific starting position guidance.
 */

const startingPositionTemplates: Record<string, string> = {
  // Horizontal Push
  horizontalPush: `Feet flat on platform, slightly narrower than shoulder-width. Shoulder blades retracted into the bench. Grip slightly wider than shoulders. Lower back maintains contact with the bench.`,

  // Vertical Push
  verticalPush: `Feet shoulder-width apart, stable stance. Shoulders packed with scapulae depressed. Core braced and glutes engaged. Bar at collarbone or upper chest.`,

  // Horizontal Pull
  horizontalPull: `Hinge forward from the hips with neutral spine, knees slightly bent. Chest nearly parallel to the floor. Scapulae in neutral position. Arms extended straight down toward the weight.`,

  // Vertical Pull
  verticalPull: `Full arm extension overhead or at chest height depending on grip width. Shoulders engaged and packed. Scapulae in neutral. Stable stance with core braced.`,

  // Squat
  squat: `Feet shoulder-width apart, toes slightly turned out. Chest up, shoulders back. Weight distributed evenly across the forefoot. Knees tracking over toes, neutral spine.`,

  // Hinge
  hinge: `Feet hip-width apart. Slight knee bend throughout. Neutral spine. Weight centered in midfoot. Shoulders pulled back and engaged.`,

  // Carry
  carry: `Feet hip-width apart. Shoulders packed and core braced. Neutral spine maintained. Weight distributed evenly. For unilateral carries: torso upright without leaning to the opposite side.`,

  // Rotation / Anti-rotation
  rotation: `Seated or standing with neutral spine. Feet hip-width apart if standing. Core engaged. Shoulders away from ears. Start in a neutral rotational position.`,

  // Isolation exercises (general)
  isolation: `Stable, supported position specific to the joint being worked. Ensure isolation of the target joint by stabilizing surrounding segments. Starting position allows full range of motion through the target joint.`,

  // Bodyweight / Plyometric
  bodyweight: `Athletic stance with feet hip-width apart. Knees slightly bent. Shoulders back, chest up. Weight on the forefoot, ready to generate force.`,

  // Machine exercises
  machine: `Adjust seat and handles to appropriate height. Ensure spine is against the backrest (if applicable). Position limbs along the machine's range-of-motion path. Ensure stable hand/foot placement.`,

  // Cable exercises
  cable: `Stable stance perpendicular or aligned with the cable. Grip with neutral wrist. Core braced. Shoulders packed. Position allows full range of motion without compensation.`,

  // Stretch / SMR
  smr: `Position the muscle group over the rolling implement or against the stretching surface. Use controlled pressure. Support your body weight appropriately to allow for slow, deliberate movement.`,

  // Activation / Warmup
  warmup: `Relaxed, athletic position. Minimal resistance. Focus on movement quality and muscle activation. No need for heavy bracing or maximal tension.`,
};

function getStartingPositionForExercise(exercise: typeof sourceExercises.$inferSelect): string {
  // Check movement pattern flags
  if (exercise.horizontalPush) {
    return startingPositionTemplates.horizontalPush;
  }
  if (exercise.verticalPush) {
    return startingPositionTemplates.verticalPush;
  }
  if (exercise.horizontalPull) {
    return startingPositionTemplates.horizontalPull;
  }
  if (exercise.verticalPull) {
    return startingPositionTemplates.verticalPull;
  }
  if (exercise.squat) {
    return startingPositionTemplates.squat;
  }
  if (exercise.hinge) {
    return startingPositionTemplates.hinge;
  }
  if (exercise.carry) {
    return startingPositionTemplates.carry;
  }
  if (exercise.rotation || exercise.antiRotation) {
    return startingPositionTemplates.rotation;
  }

  // Check exercise type
  if (exercise.exerciseType === "SMR") {
    return startingPositionTemplates.smr;
  }
  if (exercise.exerciseType === "Activation") {
    return startingPositionTemplates.warmup;
  }
  if (exercise.exerciseType === "Warmup") {
    return startingPositionTemplates.warmup;
  }
  if (exercise.exerciseType === "Stretching") {
    return startingPositionTemplates.smr;
  }
  if (exercise.exerciseType === "Plyometrics") {
    return startingPositionTemplates.bodyweight;
  }

  // Check equipment
  if (exercise.equipment?.includes("Machine")) {
    return startingPositionTemplates.machine;
  }
  if (exercise.equipment?.includes("Cable")) {
    return startingPositionTemplates.cable;
  }

  // Check mechanics
  if (exercise.mechanics === "Isolation") {
    return startingPositionTemplates.isolation;
  }
  if (exercise.mechanics === "Compound" && exercise.exerciseType === "Strength") {
    return startingPositionTemplates.bodyweight;
  }

  // Default fallback
  return startingPositionTemplates.isolation;
}

async function populateStartingPositions() {
  console.log("Populating exercise-specific starting positions...\n");

  // Get all exercises
  const allExercises = await db.select().from(sourceExercises);

  // Get all existing starting_position overrides
  const existingOverrides = await db
    .select({ exerciseId: exerciseOverrides.exerciseId })
    .from(exerciseOverrides)
    .where(
      and(
        eq(exerciseOverrides.field, "starting_position"),
        isNull(exerciseOverrides.profileId)
      )
    );

  const overriddenIds = new Set(existingOverrides.map((o) => o.exerciseId));

  // Filter to exercises without overrides
  const exercisesWithoutOverride = allExercises.filter(
    (e) => !overriddenIds.has(e.exerciseId)
  );

  console.log(`Found ${exercisesWithoutOverride.length} exercises needing starting positions\n`);

  let added = 0;
  let failed = 0;

  for (const exercise of exercisesWithoutOverride) {
    try {
      const position = getStartingPositionForExercise(exercise);

      await db.insert(exerciseOverrides).values({
        exerciseId: exercise.exerciseId,
        profileId: null,
        field: "starting_position",
        value: position,
      });

      added++;
      if (added % 100 === 0) {
        console.log(`✓ Added ${added} starting positions...`);
      }
    } catch (error) {
      failed++;
      console.error(`✗ ${exercise.exerciseId} (${exercise.name}): ${error}`);
    }
  }

  console.log(`\n✅ Added ${added} exercise-specific starting positions`);
  if (failed > 0) {
    console.log(`⚠️  Failed to add ${failed} starting positions`);
  }

  process.exit(0);
}

populateStartingPositions().catch((error) => {
  console.error(error);
  process.exit(1);
});
