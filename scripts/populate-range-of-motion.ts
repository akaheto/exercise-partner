import { db } from "../src/db/client";
import { exerciseOverrides, sourceExercises } from "../src/db/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Populate exercise-specific range of motion guidance for all exercises.
 * Uses movement patterns and exercise classification to generate targeted ROM guidance.
 */

const romByPattern: Record<string, string> = {
  // Horizontal Push
  horizontalPush: `Lower the bar to chest height with elbows at approximately 45-75 degrees from the body. Achieve full elbow extension at the top without hyperextending. Maintain scapular retraction throughout the range.`,

  // Vertical Push
  verticalPush: `Press to full overhead lockout with the bar slightly forward of the head. Lower to shoulders or upper chest, stopping before excessive shoulder stress. Maintain a stable trunk throughout without excessive lower back extension.`,

  // Horizontal Pull
  horizontalPull: `Pull until the weight approaches the torso or until elbows reach approximately 90 degrees behind the midline. Achieve full scapular retraction at the peak. Return with control to full arm extension without losing tension.`,

  // Vertical Pull
  verticalPull: `Start with full arm extension overhead. Pull until the bar approaches chest height or collarbone level. Achieve full scapular depression at the bottom. Return with control to full extension without kipping or jerking.`,

  // Squat - Knee Dominant
  squat: `Descend until the crease of the hip is at or below knee height if mobility allows. Maintain an upright torso and neutral spine throughout. Ascend to full knee extension with equal weight distribution through the forefoot.`,

  // Hinge - Hip Dominant
  hinge: `Lower the weight until the bar reaches mid-shin or until hamstring tension becomes limiting. Maintain a neutral spine throughout the movement. Extend the hips and knees fully at the top without overextending the lower back.`,

  // Carry
  carry: `Walk for prescribed distance or time maintaining a neutral spine and controlled pace. Maintain even loading without leaning. Distance or time goal determines the endpoint rather than a specific position.`,

  // Rotation
  rotation: `Rotate through a full range of motion that you can control. Alternate sides equally if the exercise involves both sides. Maintain an upright posture without spinal flexion or excessive momentum.`,

  // Isolation - Elbow Extension
  elbowExtension: `Extend the arms from a bent position to full or near-full elbow extension. Achieve a strong contraction at the top. Return with control without completely relaxing tension at the bottom position.`,

  // Isolation - Elbow Flexion
  elbowFlexion: `Curl from full arm extension at the bottom to full flexion at the top. Achieve a peak contraction at the top position. Lower with control to full extension without dropping the weight.`,

  // Isolation - Shoulder / Lateral Raise
  shoulder: `Raise the arms to approximately shoulder height or slightly above. Achieve a full contraction at the top. Lower with control to the starting position without complete loss of tension.`,

  // Isolation - Leg Curl
  legCurl: `Curl the heels toward the glutes through a full range of motion. Achieve full or near-full knee flexion at the top. Return with control to near-full knee extension at the bottom.`,

  // Isolation - Leg Extension
  legExtension: `Extend from a bent position to full or near-full knee extension at the top. Achieve a strong contraction at the top position. Lower with control through the full range without banging the weight stack.`,

  // Isolation - Chest Fly / Pec Deck
  chestFly: `Bring the arms together in front of the chest with a slight bend in the elbows maintained throughout. Achieve a strong pectoral contraction at the top. Return with control to the starting position, feeling a stretch across the chest.`,

  // Core - Flexion / Crunch
  coreFlexion: `Crunch from a relaxed position to full abdominal contraction. Achieve maximum rib cage to pelvis distance at the top. Return with control without completely relaxing tension at the bottom.`,

  // Plyometric
  plyometric: `Perform explosive movement through a safe, controlled range. Land softly with bent knees to absorb force. Maintain balance and control at both top and bottom positions.`,

  // SMR / Myofascial Release
  smr: `Roll slowly over the target muscle group, pausing on tender points for 15-30 seconds. Use a speed of approximately 1 inch per second. Cover the full length of the muscle without bouncing or rushing.`,

  // Warmup / Activation / Low-Intensity
  warmup: `Use a full, controlled range of motion emphasizing movement quality over load. Avoid explosive or jerky movements. Focus on achieving muscle activation and movement awareness.`,

  // Machine Exercises - General
  machine: `Move through the full available range of the machine. Achieve full extension and contraction at the end ranges. Avoid locking out joints or completely relaxing at the bottom.`,

  // Cable Exercises - General
  cable: `Move through a full range of motion that allows you to maintain constant tension. Avoid allowing the cable to go slack at any point. Achieve full extension and contraction within the cable's available range.`,

  // Default fallback
  default: `Move through a full, controlled range of motion. Achieve a strong contraction at the peak position. Return with control without completely losing tension at the bottom position.`,
};

function getRangeOfMotionForExercise(
  exercise: typeof sourceExercises.$inferSelect
): string {
  // Check movement pattern flags
  if (exercise.horizontalPush) {
    return romByPattern.horizontalPush;
  }
  if (exercise.verticalPush) {
    return romByPattern.verticalPush;
  }
  if (exercise.horizontalPull) {
    return romByPattern.horizontalPull;
  }
  if (exercise.verticalPull) {
    return romByPattern.verticalPull;
  }
  if (exercise.squat) {
    return romByPattern.squat;
  }
  if (exercise.hinge) {
    return romByPattern.hinge;
  }
  if (exercise.carry) {
    return romByPattern.carry;
  }
  if (exercise.rotation || exercise.antiRotation) {
    return romByPattern.rotation;
  }
  if (exercise.core) {
    return romByPattern.coreFlexion;
  }

  // Check exercise type for special cases
  if (exercise.exerciseType === "Plyometrics") {
    return romByPattern.plyometric;
  }
  if (exercise.exerciseType === "SMR" || exercise.exerciseType === "Stretching") {
    return romByPattern.smr;
  }
  if (exercise.exerciseType === "Warmup" || exercise.exerciseType === "Activation") {
    return romByPattern.warmup;
  }

  // Check exercise name for common isolation patterns
  const nameLower = exercise.name.toLowerCase();
  if (
    nameLower.includes("curl") ||
    nameLower.includes("flexion") ||
    nameLower.includes("preacher")
  ) {
    return romByPattern.elbowFlexion;
  }
  if (
    nameLower.includes("tricep") ||
    nameLower.includes("extension") ||
    nameLower.includes("press down") ||
    nameLower.includes("kickback")
  ) {
    return romByPattern.elbowExtension;
  }
  if (
    nameLower.includes("raise") ||
    nameLower.includes("lateral") ||
    nameLower.includes("front raise") ||
    nameLower.includes("reverse") ||
    nameLower.includes("pec deck")
  ) {
    return romByPattern.shoulder;
  }
  if (nameLower.includes("leg curl")) {
    return romByPattern.legCurl;
  }
  if (nameLower.includes("leg extension")) {
    return romByPattern.legExtension;
  }
  if (nameLower.includes("fly") || nameLower.includes("flye")) {
    return romByPattern.chestFly;
  }
  if (
    nameLower.includes("crunch") ||
    nameLower.includes("sit-up") ||
    nameLower.includes("ab")
  ) {
    return romByPattern.coreFlexion;
  }

  // Check equipment
  if (exercise.equipment?.includes("Machine")) {
    return romByPattern.machine;
  }
  if (exercise.equipment?.includes("Cable")) {
    return romByPattern.cable;
  }

  // Default fallback
  return romByPattern.default;
}

async function populateRangeOfMotion() {
  console.log("Populating exercise-specific range of motion guidance...\n");

  // Get all exercises
  const allExercises = await db.select().from(sourceExercises);

  console.log(`Found ${allExercises.length} exercises to populate with range of motion guidance\n`);

  let added = 0;
  let failed = 0;

  for (const exercise of allExercises) {
    try {
      const rom = getRangeOfMotionForExercise(exercise);

      await db.insert(exerciseOverrides).values({
        exerciseId: exercise.exerciseId,
        profileId: null,
        field: "range_of_motion",
        value: rom,
      });

      added++;
      if (added % 100 === 0) {
        console.log(`✓ Added ${added} range of motion overrides...`);
      }
    } catch (error) {
      failed++;
      console.error(`✗ ${exercise.exerciseId} (${exercise.name}): ${error}`);
    }
  }

  console.log(`\n✅ Added ${added} exercise-specific range of motion descriptions`);
  if (failed > 0) {
    console.log(`⚠️  Failed to add ${failed} overrides`);
  }

  process.exit(0);
}

populateRangeOfMotion().catch((error) => {
  console.error(error);
  process.exit(1);
});
