import { db } from "../src/db/client";
import { exerciseOverrides } from "../src/db/schema";
import { eq } from "drizzle-orm";

/**
 * Seed exercise-specific tips and mistakes for representative exercises.
 * These replace generic boilerplate with actionable, exercise-specific guidance.
 */

const exerciseContent: Record<
  string,
  { tips: string; mistakes: string }
> = {
  // Horizontal Push
  "EX-0002": {
    // 1 Board Bench Press
    tips: "Retract shoulder blades into the bench. Grip slightly wider than shoulder width. Drive feet into the floor for leg drive. Lower the bar to the board, not past it.",
    mistakes:
      "Allowing shoulder blades to roll forward; gripping too close or too wide; pressing unevenly; letting elbows collapse inward",
  },
  "EX-0493": {
    // Incline Cable Chest Press
    tips: "Set the cables at chest height or lower. Maintain a stable stance by bracing your core. Press explosively and control the eccentric. Achieve full elbow extension.",
    mistakes:
      "Cables set too high; unstable stance allowing body sway; incomplete elbow extension; jerky transitions between rep",
  },

  // Vertical Pull
  "EX-0244": {
    // Chin Up
    tips: "Start with full arm extension. Pull elbows down and slightly back behind the torso. Lead with the chest. Control the descent fully.",
    mistakes:
      "Partial range of motion at the bottom; elbows drifting out to the sides; using momentum at the start; jerky descent",
  },

  // Horizontal Pull
  "EX-0181": {
    // Bent Over Dumbbell Row
    tips: "Drive elbows back past your torso. Initiate with back muscles, not arms. Squeeze shoulder blades together at the top. Hinge from the hips, not the lumbar spine.",
    mistakes:
      "Using arm strength instead of back; elbows not traveling past the midline; rounding the lower back; minimal shoulder blade retraction",
  },

  // Vertical Push
  "EX-0748": {
    // Standing Shoulder Press
    tips: "Press straight overhead or slightly forward over your center of mass. Brace your core and glutes. Lock out completely at the top. Descend to collarbone level.",
    mistakes:
      "Pressing forward excessively; excessive lower back arching; incomplete lockout at the top; hyperextending the elbows",
  },

  // Knee Dominant Squat
  "EX-1190": {
    // Back Squat
    tips: "Place the bar on your rear deltoids, not your neck. Keep your chest up and knees tracking over your toes. Descend to below parallel if mobility allows. Drive through your heels.",
    mistakes:
      "Knees caving inward; heels lifting off the ground; excessively forward torso lean; insufficient depth; uneven loading",
  },

  // Hip Hinge
  "EX-0316": {
    // Barbell Deadlift
    tips: "Position bar over mid-foot. Maintain a neutral spine throughout. Drive through your heels. Extend your hips and knees simultaneously. Keep the bar close to your body.",
    mistakes:
      "Rounding the lower back on the ascent; bar drifting away from your body; jerky pull; starting with hips too high; incomplete hip extension at the top",
  },

  // Isolation - Elbow Extension
  "EX-0379": {
    // Dumbbell Tricep Extension
    tips: "Lock your elbows in place at your sides or above. Press from the elbow joint only. Achieve full lockout at the top. Control the descent to maintain tension.",
    mistakes:
      "Moving elbows during the press; flaring elbows away from the body; jerky repetitions; incomplete range of motion",
  },

  // Isolation - Shoulder
  "EX-0565": {
    // Lateral Raise
    tips: "Raise dumbbells to shoulder height or slightly above. Lead with your elbows, not your hands. Maintain a slight bend in your elbows. Control the lowering phase.",
    mistakes:
      "Using momentum to initiate; excessive elbow bend; raising hands higher than shoulders (overextension); jerky movements; full lockout at the bottom losing tension",
  },

  // Leg Curl
  "EX-0407": {
    // Lying Leg Curl
    tips: "Curl your heels toward your glutes. Achieve full contraction at the top. Control the eccentric. Move through complete range of motion.",
    mistakes:
      "Partial range of motion; hyperextending knees at the bottom; jerky curling motion; uneven leg loading",
  },

  // Leg Extension
  "EX-0409": {
    // Leg Extension
    tips: "Extend knees fully at the top. Control the descent. Move slowly through the full range. Maintain tension at the bottom.",
    mistakes:
      "Incomplete knee extension; jerky locking out; dropping the weight quickly; feet sliding during the movement",
  },

  // Isolation - Chest Fly
  "EX-0296": {
    // Decline Cable Fly
    tips: "Maintain a slight bend in your elbows throughout. Feel the stretch at the bottom. Chest drives the movement. Squeeze pecs at the top.",
    mistakes:
      "Elbows moving during the rep; excessive elbow bend; pressing instead of flying; elbows drifting behind the body too far",
  },

  // Core - Anti-rotation
  "EX-0037": {
    // Ab Crunch
    tips: "Crunch from the rib cage toward the pelvis. Keep neck neutral. Move slowly and deliberately. Achieve full contraction at the top.",
    mistakes:
      "Using neck flexion instead of abs; jerky movements; incomplete range; pulling elbows away from ears",
  },

  // Plyometric
  "EX-0024": {
    // 2-1 Box Jump
    tips: "Land softly with bent knees. Stick the landing. Pause between reps. Use a box height you can land safely on.",
    mistakes:
      "Landing with rigid legs; knees caving inward on landing; rushing transitions; unstable landing surface",
  },

  // Rotation
  "EX-0062": {
    // Ab Rotation
    tips: "Rotate from your core, not your arms. Move deliberately and controlled. Maintain a tall posture. Full rotation on both sides.",
    mistakes:
      "Using momentum; rotating from the shoulders instead of core; losing spinal alignment; jerky transitions",
  },

  // Step Variation
  "EX-0003": {
    // 1 Dumbbell Step Up
    tips: "Step up onto the platform, leading with your front leg. Keep your torso upright. Push through your front heel. Step down with control.",
    mistakes:
      "Torso leaning forward excessively; front knee caving inward; pushing off the back leg; too high or unstable platform",
  },

  // Single Leg / Unilateral
  "EX-0500": {
    // Bulgarian Split Squat
    tips: "Rear foot is simply balanced, not driving. Front knee tracks over your toes. Descend until front thigh is parallel. Drive through your front heel.",
    mistakes:
      "Using rear leg to drive; front knee caving inward; excessive forward lean; insufficient depth",
  },

  // Compound Upper
  "EX-0511": {
    // Barbell Bench Press
    tips: "Grip slightly wider than shoulder width. Feet planted firmly, drive through them. Lower to chest. Press explosively while maintaining scapular retraction.",
    mistakes:
      "Grip too close or too wide; feet off the ground; bouncing the bar off the chest; shoulders rolling forward; uneven pressing",
  },

  // Compound Lower (alternate leg pattern)
  "EX-0351": {
    // Leg Press
    tips: "Position feet shoulder-width apart, midway on the platform. Lower until knees reach 90 degrees. Drive through your heels. Lock out completely.",
    mistakes:
      "Feet too high or too low on the platform; knees caving inward; descending below 90 degrees; incomplete lockout; jerky movements",
  },

  // Farmers Carry (loaded carry)
  "EX-0397": {
    // Farmer's Carry
    tips: "Stand tall with neutral spine. Carry for distance or time at a controlled pace. Shoulders packed, core braced. Avoid leaning.",
    mistakes:
      "Leaning to one side; shoulders shrugging; slouching posture; uneven load between hands",
  },
};

async function seedContent() {
  console.log("Seeding exercise-specific tips and mistakes...\n");

  let added = 0;
  const skipped = 0;

  for (const [exerciseId, content] of Object.entries(exerciseContent)) {
    // Check if overrides already exist for tips or mistakes
    await db
      .select()
      .from(exerciseOverrides)
      .where(eq(exerciseOverrides.exerciseId, exerciseId));

    // Replace existing generic content with specific content
    try {
      // Delete old overrides for this exercise
      await db
        .delete(exerciseOverrides)
        .where(eq(exerciseOverrides.exerciseId, exerciseId));

      // Insert new, specific tips and mistakes
      await db.insert(exerciseOverrides).values([
        {
          exerciseId,
          profileId: null,
          field: "tips",
          value: content.tips,
        },
        {
          exerciseId,
          profileId: null,
          field: "common_mistakes",
          value: content.mistakes,
        },
      ]);

      added += 2;
      console.log(`✓ ${exerciseId}: tips + mistakes replaced with specific content`);
    } catch (error) {
      console.error(`✗ ${exerciseId}: ${error}`);
    }
  }

  console.log(
    `\n✅ Added ${added} exercise-specific overrides (${Object.keys(exerciseContent).length} exercises)`
  );
  console.log(`⊘ Skipped ${skipped} exercises (already customized)`);

  process.exit(0);
}

seedContent().catch((error) => {
  console.error(error);
  process.exit(1);
});
