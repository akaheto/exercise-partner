import { db } from "../src/db/client";
import { sourceExercises, exerciseOverrides } from "../src/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generate exercise-specific tips and common mistakes based on exercise characteristics.
 * This creates a mapping of exercise patterns to their typical mistakes/tips.
 */

// Map exercise types and movement patterns to specific mistakes
const mistakesByPattern: Record<string, Record<string, string>> = {
  "Horizontal Push": {
    mistakes:
      "Not maintaining scapular retraction; allowing elbows to flare excessively; pressing in an unsafe shoulder position; losing neutral spine",
    tips: "Keep shoulder blades pinned back throughout. Maintain a stable wrist. Drive through the middle of your foot for leg drive.",
  },
  "Vertical Push": {
    mistakes:
      "Pressing forward instead of vertical; elbows drifting away from the body; excessive lower back arching; overextending at the elbow",
    tips: "Press straight overhead or slightly forward. Keep core braced. Avoid hyperextending at the top.",
  },
  "Horizontal Pull": {
    mistakes:
      "Using arm strength instead of pulling from the back; not achieving full retraction; rounding the shoulders forward; jerking the weight",
    tips: "Initiate with your back muscles, not your arms. Pull elbows back past your torso. Maintain chest height.",
  },
  "Vertical Pull": {
    mistakes:
      "Starting with arms already bent; elbows drifting out; excessive backward lean; incomplete range of motion",
    tips: "Start with a full arm extension. Pull elbows down and back. Control the eccentric (lowering) phase.",
  },
  "Squat / Knee Dominant": {
    mistakes:
      "Knees caving inward; heels lifting off the ground; torso collapsing forward; not reaching adequate depth",
    tips: "Keep knees tracking over your toes. Weight in your heels. Maintain an upright torso. Descend to your full comfortable depth.",
  },
  "Hinge / Hip Dominant": {
    mistakes:
      "Rounding the lower back; hyperextending at the top; jerky movements; bending knees too much on descent",
    tips: "Maintain a neutral spine throughout. Move from the hips, not the low back. Control the speed. Keep knees slightly bent.",
  },
  "Elbow Extension": {
    mistakes:
      "Moving the elbow joint; flaring elbows away from the body; jerky or bouncy repetitions; incomplete range",
    tips: "Lock your elbows in position. Press or extend from the elbow only. Full extension at the end.",
  },
  "Elbow Flexion": {
    mistakes:
      "Using momentum; moving at the shoulder; incomplete range; dropping quickly to the bottom",
    tips: "Keep your elbows locked at your sides. Curl with control. Squeeze at the top. Control the eccentric.",
  },
  "Rotation": {
    mistakes:
      "Using momentum; rotating from the arms instead of the core; losing neutral spine; incomplete range",
    tips: "Move slowly and under control. Rotate from your core, not your arms. Maintain a neutral spine.",
  },
  "Plantar Flexion": {
    mistakes:
      "Using momentum; incomplete range of motion; uneven weight distribution; jerky movements",
    tips: "Move through full range. Control the descent. Even weight on both sides of your foot.",
  },
  "Jump / Plyometric": {
    mistakes:
      "Landing with bent knees; landing with knees that cave inward; jerky transitions; incomplete depth",
    tips: "Land softly with control. Stick each landing. Maintain knee alignment. Use the stretch reflex.",
  },
};

async function generateContent() {
  console.log("Generating exercise-specific content...\n");

  // Get all exercises with their current tips and mistakes
  const exercises = await db.select().from(sourceExercises).limit(50); // Start with first 50 for testing

  let updated = 0;

  for (const exercise of exercises) {
    const pattern = exercise.movementPattern as string;

    // Skip if we don't have a pattern
    if (!pattern || !mistakesByPattern[pattern]) {
      continue;
    }

    const content = mistakesByPattern[pattern];

    // Skip if already has custom overrides (don't overwrite manual edits)
    const existingOverrides = await db
      .select()
      .from(exerciseOverrides)
      .where(
        eq(exerciseOverrides.exerciseId, exercise.exerciseId) &&
          (eq(exerciseOverrides.field, "common_mistakes") ||
            eq(exerciseOverrides.field, "tips"))
      );

    if (existingOverrides.length > 0) {
      console.log(`Skipping ${exercise.exerciseId} (already has overrides)`);
      continue;
    }

    // Create overrides for common mistakes and tips
    try {
      await db.insert(exerciseOverrides).values([
        {
          exerciseId: exercise.exerciseId,
          profileId: null,
          field: "common_mistakes",
          value: content.mistakes,
        },
        {
          exerciseId: exercise.exerciseId,
          profileId: null,
          field: "tips",
          value: content.tips,
        },
      ]);

      updated++;
      console.log(
        `✓ ${exercise.exerciseId} (${exercise.name}): ${pattern}`
      );
    } catch (error) {
      console.error(`✗ ${exercise.exerciseId}: ${error}`);
    }
  }

  console.log(`\n✅ Generated content for ${updated} exercises`);
  console.log(
    "\nNote: This is a template approach. For production, review patterns and refine content per exercise type."
  );

  process.exit(0);
}

generateContent().catch((error) => {
  console.error(error);
  process.exit(1);
});
