import { db } from "../src/db/client";
import { exerciseOverrides, sourceExercises } from "../src/db/schema";
import { isNull } from "drizzle-orm";

/**
 * Populate exercise-specific tips and common mistakes for all exercises.
 * Uses movement patterns and exercise classification to generate targeted guidance.
 */

interface ExerciseContent {
  tips: string;
  mistakes: string;
}

const contentByPattern: Record<string, ExerciseContent> = {
  // Horizontal Push (bench press, floor press, push-ups, etc.)
  horizontalPush: {
    tips:
      "Retract shoulder blades into the surface throughout the movement. Grip slightly wider than shoulder-width. Drive feet into the floor for leg drive. Achieve full lockout without hyperextending the elbows.",
    mistakes:
      "Allowing shoulder blades to roll forward; gripping too close or too wide; pressing unevenly; losing leg drive or foot position; incomplete lockout",
  },

  // Vertical Push (overhead press, pike push-ups, handstand press, etc.)
  verticalPush: {
    tips:
      "Press straight overhead or slightly forward over your center of mass. Maintain core and glute tension throughout. Achieve full lockout with aligned shoulders. Descend to shoulders or upper chest before the next rep.",
    mistakes:
      "Excessive lower back arching; pressing too far forward; incomplete lockout; elbows flaring excessively wide; losing core tension",
  },

  // Horizontal Pull (rows, bench rows, etc.)
  horizontalPull: {
    tips:
      "Drive elbows back past your torso, not out to the sides. Initiate with back muscles, not arm strength. Squeeze shoulder blades together at the peak. Hinge from the hips, maintaining a neutral spine.",
    mistakes:
      "Using arm strength instead of back muscles; elbows not traveling past the midline; rounding the lower back; minimal shoulder blade retraction; jerky movements",
  },

  // Vertical Pull (pull-ups, chin-ups, lat pulldowns, etc.)
  verticalPull: {
    tips:
      "Start with full arm extension. Pull elbows down and back, leading with the chest. Achieve full scapular depression at the bottom. Control the descent fully without dropping.",
    mistakes:
      "Partial range of motion at full extension; elbows drifting out to the sides; using momentum to initiate; jerky descent; incomplete scapular depression",
  },

  // Squat (back squat, front squat, goblet squat, leg press, etc.)
  squat: {
    tips:
      "Keep your chest up and weight distributed evenly across the forefoot. Knees track over your toes throughout. Descend to below parallel if mobility allows. Drive through your heels to stand, maintaining spinal alignment.",
    mistakes:
      "Knees caving inward during descent or ascent; heels lifting off the ground; excessive forward torso lean; insufficient depth; uneven loading or bar drift",
  },

  // Hinge (deadlift, good mornings, Romanian deadlifts, etc.)
  hinge: {
    tips:
      "Keep the bar close to your body throughout the movement. Maintain a neutral spine by bracing your core. Drive through your entire foot, initiating the movement with your hips and legs. Extend completely at the top without overextending the lower back.",
    mistakes:
      "Rounding the lower back on the pull; bar drifting away from your body; starting with hips too high; jerky movements; incomplete hip extension; losing neutral spine",
  },

  // Carries (farmer's carry, waiter's walk, suitcase carry, etc.)
  carry: {
    tips:
      "Stand tall with a neutral spine. Shoulders packed and core braced. Carry at a controlled pace for distance or time. Avoid leaning to one side; maintain even loading if unilateral.",
    mistakes:
      "Leaning to one side to compensate for load; shoulders shrugging; slouching posture; jerky pace; uneven load distribution between limbs",
  },

  // Rotation / Anti-rotation
  rotation: {
    tips:
      "Rotate from your core, not your arms or shoulders. Move deliberately and controlled throughout the range. Maintain a tall posture with minimal spinal flexion. Achieve full rotation on both sides if alternating.",
    mistakes:
      "Using momentum to drive rotation; rotating from shoulders instead of core; losing spinal alignment; jerky transitions between reps; minimal range of motion",
  },

  // Isolation - Elbow Extension (tricep press, tricep extension, kickback, etc.)
  elbowExtension: {
    tips:
      "Lock elbows in place at your sides or above. Press from the elbow joint only. Achieve full lockout at the top. Control the descent to maintain tension throughout the range.",
    mistakes:
      "Allowing elbows to move away from the body during the press; incomplete range of motion; flaring elbows excessively; jerky repetitions; losing tension at the bottom",
  },

  // Isolation - Elbow Flexion (bicep curl, etc.)
  elbowFlexion: {
    tips:
      "Keep elbows at your sides or slightly in front, avoiding excessive movement. Curl through the full range of motion under control. Achieve a full contraction at the top. Control the descent to maintain tension.",
    mistakes:
      "Swinging the weight using momentum; elbows drifting forward or backward during the curl; incomplete range of motion; jerky movements; losing tension at the bottom",
  },

  // Isolation - Shoulder (lateral raise, front raise, reverse pec deck, etc.)
  shoulder: {
    tips:
      "Lead with the elbows, not the hands. Maintain a slight bend in your elbows throughout. Raise to shoulder height or slightly above. Control the lowering phase to maintain tension.",
    mistakes:
      "Using momentum to initiate the movement; excessive elbow bend; raising hands higher than shoulders; jerky movements; losing tension at the bottom",
  },

  // Isolation - Leg Curl
  legCurl: {
    tips:
      "Curl your heels toward your glutes through your full range of motion. Achieve full contraction at the top. Control the eccentric portion. Move slowly without bouncing.",
    mistakes:
      "Partial range of motion; hyperextending knees at the bottom; jerky curling motion; uneven leg loading; losing tension throughout the range",
  },

  // Isolation - Leg Extension
  legExtension: {
    tips:
      "Extend knees fully at the top without hyperextending. Move slowly through the full range. Control the descent. Maintain tension throughout, avoiding complete lock-out loss.",
    mistakes:
      "Incomplete knee extension; jerky locking out; dropping weight quickly; feet sliding during the movement; excessive forward lean of the torso",
  },

  // Isolation - Chest Fly
  chestFly: {
    tips:
      "Maintain a slight bend in your elbows throughout the movement. Feel the stretch at the bottom. Drive the movement with your chest muscles. Squeeze at the top position.",
    mistakes:
      "Elbows moving during the rep; excessive elbow bend or straightening; pressing instead of flying; elbows drifting behind the body; jerky transitions",
  },

  // Core - Crunches and Flexion
  coreFlexion: {
    tips:
      "Crunch from the rib cage toward the pelvis, not from the neck. Keep your neck neutral throughout. Move slowly and deliberately. Achieve full contraction at the top.",
    mistakes:
      "Using neck flexion instead of abdominal muscles; jerky movements; incomplete range of motion; pulling the elbows away from your ears; excessive neck strain",
  },

  // Plyometrics
  plyometric: {
    tips:
      "Land softly with bent knees to absorb force. Stick landings and demonstrate control. Use a box height you can land safely on. Pause between reps to reset.",
    mistakes:
      "Landing with rigid, locked legs; knees caving inward on landing; rushing transitions without pausing; unstable landing surface or height",
  },

  // SMR / Myofascial Release
  smr: {
    tips:
      "Use slow, deliberate movements over the muscle group. Apply comfortable pressure without causing sharp pain. Pause on tender points for 15-30 seconds. Breathe steadily throughout.",
    mistakes:
      "Moving too quickly over the tissue; applying excessive pressure causing pain; skipping tender areas; holding tension instead of breathing; rushing the process",
  },

  // Warmup / Activation / Low-intensity
  warmup: {
    tips:
      "Focus on movement quality and muscle activation over load. Use controlled movements without jerking. Gradually increase intensity. Emphasize full range of motion and muscle connection.",
    mistakes:
      "Moving too quickly or with poor form; using excessive load during warmup; failing to achieve full range of motion; losing focus on muscle activation",
  },

  // Default fallback for unclassified
  default: {
    tips:
      "Move deliberately and under control throughout the entire range of motion. Prioritize form and muscle engagement over load. Maintain consistent breathing and body tension.",
    mistakes:
      "Using momentum instead of muscular control; incomplete range of motion; jerky or explosive movements; losing form under load; rushing repetitions",
  },
};

function getTipsAndMistakesForExercise(
  exercise: typeof sourceExercises.$inferSelect
): ExerciseContent {
  // Check movement pattern flags
  if (exercise.horizontalPush) {
    return contentByPattern.horizontalPush;
  }
  if (exercise.verticalPush) {
    return contentByPattern.verticalPush;
  }
  if (exercise.horizontalPull) {
    return contentByPattern.horizontalPull;
  }
  if (exercise.verticalPull) {
    return contentByPattern.verticalPull;
  }
  if (exercise.squat) {
    return contentByPattern.squat;
  }
  if (exercise.hinge) {
    return contentByPattern.hinge;
  }
  if (exercise.carry) {
    return contentByPattern.carry;
  }
  if (exercise.rotation) {
    return contentByPattern.rotation;
  }
  if (exercise.antiRotation) {
    return contentByPattern.rotation;
  }
  if (exercise.core) {
    return contentByPattern.coreFlexion;
  }

  // Check exercise type for special cases
  if (exercise.exerciseType === "Plyometrics") {
    return contentByPattern.plyometric;
  }
  if (
    exercise.exerciseType === "SMR" ||
    exercise.exerciseType === "Stretching"
  ) {
    return contentByPattern.smr;
  }
  if (
    exercise.exerciseType === "Warmup" ||
    exercise.exerciseType === "Activation"
  ) {
    return contentByPattern.warmup;
  }

  // Check exercise name for common isolation patterns
  const nameLower = exercise.name.toLowerCase();
  if (
    nameLower.includes("curl") ||
    nameLower.includes("flexion") ||
    nameLower.includes("preacher")
  ) {
    return contentByPattern.elbowFlexion;
  }
  if (
    nameLower.includes("tricep") ||
    nameLower.includes("extension") ||
    nameLower.includes("press down")
  ) {
    return contentByPattern.elbowExtension;
  }
  if (
    nameLower.includes("raise") ||
    nameLower.includes("lateral") ||
    nameLower.includes("front raise") ||
    nameLower.includes("reverse") ||
    nameLower.includes("pec deck")
  ) {
    return contentByPattern.shoulder;
  }
  if (nameLower.includes("leg curl")) {
    return contentByPattern.legCurl;
  }
  if (nameLower.includes("leg extension")) {
    return contentByPattern.legExtension;
  }
  if (nameLower.includes("fly") || nameLower.includes("flye")) {
    return contentByPattern.chestFly;
  }
  if (
    nameLower.includes("crunch") ||
    nameLower.includes("sit-up") ||
    nameLower.includes("ab")
  ) {
    return contentByPattern.coreFlexion;
  }

  // Default fallback
  return contentByPattern.default;
}

async function populateTipsAndMistakes() {
  console.log("Populating exercise-specific tips and common mistakes...\n");

  // Get all exercises
  const allExercises = await db.select().from(sourceExercises);

  // Get all existing tips and mistakes overrides
  const existingOverrides = await db
    .select({ exerciseId: exerciseOverrides.exerciseId, field: exerciseOverrides.field })
    .from(exerciseOverrides)
    .where(isNull(exerciseOverrides.profileId));

  const overriddenByField = new Map<string, Set<string>>();
  for (const override of existingOverrides) {
    if (!overriddenByField.has(override.field)) {
      overriddenByField.set(override.field, new Set());
    }
    overriddenByField.get(override.field)!.add(override.exerciseId);
  }

  const tipsOverridden = overriddenByField.get("tips") || new Set();
  const mistakesOverridden = overriddenByField.get("common_mistakes") || new Set();

  // Filter to exercises without these overrides
  const exercisesNeedingContent = allExercises.filter(
    (e) => !tipsOverridden.has(e.exerciseId) || !mistakesOverridden.has(e.exerciseId)
  );

  console.log(`Found ${exercisesNeedingContent.length} exercises needing tips/mistakes\n`);

  let addedTips = 0;
  let addedMistakes = 0;
  let failed = 0;

  for (const exercise of exercisesNeedingContent) {
    try {
      const content = getTipsAndMistakesForExercise(exercise);

      // Insert tips if not already overridden
      if (!tipsOverridden.has(exercise.exerciseId)) {
        await db.insert(exerciseOverrides).values({
          exerciseId: exercise.exerciseId,
          profileId: null,
          field: "tips",
          value: content.tips,
        });
        addedTips++;
      }

      // Insert mistakes if not already overridden
      if (!mistakesOverridden.has(exercise.exerciseId)) {
        await db.insert(exerciseOverrides).values({
          exerciseId: exercise.exerciseId,
          profileId: null,
          field: "common_mistakes",
          value: content.mistakes,
        });
        addedMistakes++;
      }

      if ((addedTips + addedMistakes) % 100 === 0) {
        console.log(`✓ Added ${addedTips + addedMistakes} overrides...`);
      }
    } catch (error) {
      failed++;
      console.error(`✗ ${exercise.exerciseId} (${exercise.name}): ${error}`);
    }
  }

  console.log(`\n✅ Added ${addedTips} exercise-specific tips`);
  console.log(`✅ Added ${addedMistakes} exercise-specific common mistakes`);
  if (failed > 0) {
    console.log(`⚠️  Failed to add ${failed} overrides`);
  }

  process.exit(0);
}

populateTipsAndMistakes().catch((error) => {
  console.error(error);
  process.exit(1);
});
