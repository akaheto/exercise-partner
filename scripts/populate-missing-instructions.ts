import { db } from "../src/db/client";
import { exerciseOverrides } from "../src/db/schema";

/**
 * Populate detailed instructions for the 22 exercises missing step-by-step guidance.
 * Based on standard exercise programming and form cues for each movement.
 */

const missingInstructions: Record<string, string> = {
  // EX-0002: 1 Board Bench Press
  "EX-0002": `1. Lie flat on a bench and set your hands just outside of shoulder width. 2. Set your shoulder blades by retracting them into the bench, creating a stable base. 3. Plant your feet firmly on the floor or bench and engage your core. 4. Lower the barbell to the board (or slight chest contact) with control, maintaining elbow position at approximately 45 degrees from the body. 5. Press the bar away from your body, extending your elbows fully. 6. Repeat for the prescribed number of repetitions, maintaining tension throughout the range of motion.`,

  // EX-0003: 1 Dumbbell Step Up
  "EX-0003": `1. Stand facing a platform or box that is 8-12 inches off the ground, holding a dumbbell in one hand. 2. Place your front foot on the platform. 3. Drive through your front heel to stand up on the platform, bringing your back knee up to hip height. 4. Step down with control, returning your back foot to the ground first, followed by your front foot. 5. Repeat for the prescribed repetitions, then switch sides to balance workload. 6. Maintain an upright torso throughout the movement.`,

  // EX-0024: 2 to 1 Box Jump
  "EX-0024": `1. Stand facing a box at an appropriate height you can safely land on. 2. Begin in an athletic stance with your feet hip-width apart and arms hanging at your sides. 3. Bend your knees and swing your arms backward to generate momentum. 4. Explosively extend your hips, knees, and ankles, swinging your arms forward to propel yourself upward. 5. Land softly on the box with both feet, bending your knees to absorb force. 6. Stand up fully on the box. 7. Step down carefully with control. 8. Rest briefly between repetitions to reset before the next jump.`,

  // EX-0037: Ab Crunch
  "EX-0037": `1. Lie flat on your back with your knees bent and feet flat on the floor, positioned hip-width apart. 2. Place your hands lightly behind your head or cross your arms over your chest. 3. Engage your core and crunch upward, bringing your rib cage toward your pelvis. 4. Achieve maximum contraction at the top of the movement by squeezing your abdominal muscles. 5. Lower yourself back down with control to the starting position. 6. Repeat for the prescribed number of repetitions, avoiding jerky movements and focusing on the abdominal contraction.`,

  // EX-0062: Alternating Lying Dumbbell Extension
  "EX-0062": `1. Lie flat on a bench with your feet flat on the floor or bench. 2. Hold a dumbbell in each hand above your chest with your arms extended. 3. Keeping your upper arms stationary, lower one dumbbell in an arc toward the side of your head, bending at the elbow. 4. Extend that arm back to the starting position. 5. Repeat the movement with the opposite arm. 6. Continue alternating arms for the prescribed number of repetitions, maintaining constant tension and control throughout.`,

  // EX-0181: Bent Over Dumbbell Row
  "EX-0181": `1. Stand with your feet hip-width apart, holding a dumbbell in each hand with your arms at your sides. 2. Hinge forward from the hips until your torso is nearly parallel to the floor, maintaining a neutral spine and slight knee bend. 3. Let the dumbbells hang straight down from your shoulders. 4. Drive your elbows back and up, pulling the dumbbells toward your hips in an arc. 5. Squeeze your shoulder blades together at the top of the movement. 6. Lower the dumbbells back down with control. 7. Repeat for the prescribed number of repetitions, maintaining hip hinge position throughout.`,

  // EX-0244: Chin Up
  "EX-0244": `1. Grip the chin-up bar with an underhand (palms facing you) grip, hands positioned slightly narrower than shoulder-width apart. 2. Hang from the bar with your arms fully extended and your shoulders engaged. 3. Pull yourself upward by driving your elbows down and back, leading with your chest. 4. Continue pulling until your chin clears the bar or your chest approaches the bar. 5. Squeeze your back muscles at the top of the movement. 6. Lower yourself down with control to full arm extension. 7. Repeat for the prescribed number of repetitions, maintaining consistent form throughout.`,

  // EX-0296: Decline Cable Flys
  "EX-0296": `1. Sit on a decline bench set at an appropriate angle. 2. Grip the cable handles with a slight bend in your elbows, positioned at chest height. 3. Pull the handles together in an arc across your body, maintaining the elbow bend throughout. 4. Achieve full pectoral contraction at the center of your chest. 5. Return the handles back to the starting position with control, feeling a stretch across your chest. 6. Repeat for the prescribed number of repetitions, focusing on the pectoral squeeze rather than arm strength.`,

  // EX-0316: Donkey Calf Raise
  "EX-0316": `1. Position yourself in a donkey calf raise machine or use a partner to straddle your hips while bent over a bench. 2. Place the balls of your feet on the platform with your heels extending off the edge. 3. Maintain a straight body line from head to hips. 4. Rise up on your toes, lifting your heels as high as possible. 5. Hold briefly at the top, achieving full calf contraction. 6. Lower your heels back down with control below the level of the platform to achieve a stretch. 7. Repeat for the prescribed number of repetitions.`,

  // EX-0351: Dumbbell Rear Lunge
  "EX-0351": `1. Stand upright holding a dumbbell in each hand at your sides, feet positioned hip-width apart. 2. Step backward with one leg, extending it behind you. 3. Lower your body by bending your front knee until it reaches approximately 90 degrees, with your back knee approaching the floor. 4. Keep your torso upright and your front knee tracking over your toes. 5. Drive through your front heel to return to the starting position. 6. Repeat with the opposite leg. 7. Continue alternating legs for the prescribed number of repetitions.`,

  // EX-0379: Exercise Ball Crunch
  "EX-0379": `1. Sit on an exercise ball positioned under your lower back. 2. Place your feet flat on the floor, hip-width apart, with your knees bent at approximately 90 degrees. 3. Cross your arms over your chest or place your hands lightly behind your head. 4. Engage your core and crunch your rib cage toward your pelvis, lifting your shoulders off the ball. 5. Achieve maximum abdominal contraction at the top of the movement. 6. Lower yourself back down with control to the starting position, maintaining ball contact throughout. 7. Repeat for the prescribed number of repetitions.`,

  // EX-0397: Exercise Ball Push Up
  "EX-0397": `1. Assume a push-up position with your hands on the floor, slightly wider than shoulder-width apart. 2. Place your feet or shins on an exercise ball behind you. 3. Lower your body by bending your elbows, bringing your chest toward the floor. 4. Maintain a straight body line from head to heels, keeping your core engaged. 5. Press through your hands to extend your elbows and return to the starting position. 6. Repeat for the prescribed number of repetitions, maintaining ball stability throughout.`,

  // EX-0407: Fat Gripz Dumbbell Farmers Carry
  "EX-0407": `1. Select appropriately weighted dumbbells with Fat Gripz attachments and stand with them at your sides. 2. Grip the handles firmly with your shoulders packed and scapulae engaged. 3. Brace your core and maintain a neutral spine throughout. 4. Walk forward for the prescribed distance or time at a controlled pace. 5. Maintain even loading in both hands without leaning to either side. 6. Keep your shoulders back and your posture upright. 7. Return to the starting position with control.`,

  // EX-0409: Feet Elevated Plank
  "EX-0409": `1. Assume a plank position with your hands on the floor, shoulders over your wrists, and your body in a straight line. 2. Place your feet on a bench or elevated surface behind you. 3. Engage your core by bracing your abdominal muscles and glutes. 4. Maintain this position for the prescribed time, breathing steadily throughout. 5. Keep your hips level with your shoulders, avoiding sagging or excessive elevation. 6. Your body should form a straight line from head to heels throughout the hold.`,

  // EX-0493: Incline Cable Chest Press
  "EX-0493": `1. Adjust the cable crossover machine so the pulleys are positioned at chest height or slightly lower. 2. Set the incline of the bench to approximately 30-45 degrees. 3. Grasp each cable handle with your hands at chest height, elbows bent. 4. Press the handles away from you in a controlled manner, extending your elbows fully. 5. Achieve full lockout at the top of the movement. 6. Return the handles to chest height with control, maintaining constant tension. 7. Repeat for the prescribed number of repetitions.`,

  // EX-0500: Incline Dumbbell Flys
  "EX-0500": `1. Lie on an incline bench set at approximately 30-45 degrees with your feet flat on the floor. 2. Hold a dumbbell in each hand above your chest with your arms extended, elbows slightly bent. 3. Lower the dumbbells in a wide arc to the sides, maintaining the elbow bend throughout. 4. Feel a stretch across your chest at the bottom position. 5. Drive the dumbbells back together in an arc, achieving full pectoral contraction at the top. 6. Repeat for the prescribed number of repetitions, focusing on the pectoral squeeze.`,

  // EX-0511: Ipsilateral Bird Dog
  "EX-0511": `1. Start in a quadruped position on your hands and knees, with your hands under your shoulders and knees under your hips. 2. Simultaneously extend your right arm forward and your right leg backward, creating a straight line from fingertips to toes. 3. Hold this position briefly, engaging your core and glutes. 4. Return to the starting quadruped position with control. 5. Repeat on the same side for half the prescribed repetitions, then switch to the opposite arm and leg. 6. Maintain a neutral spine throughout, avoiding rotation or sagging.`,

  // EX-0565: Lateral Pulldown (Rope Extension)
  "EX-0565": `1. Sit at a lat pulldown machine with your thighs secured under the thigh pad. 2. Grasp the rope attachment above you with both hands, arms extended overhead. 3. Pull the rope down and toward your body in a controlled manner, bending at the elbows. 4. Drive your elbows down toward your hips, achieving full range of motion. 5. Return the rope overhead with control. 6. Repeat for the prescribed number of repetitions, maintaining an upright torso throughout.`,

  // EX-0582: Lying Barbell Reverse Extension
  "EX-0582": `1. Lie on a flat bench holding a barbell with a wide grip (hands wider than shoulder-width), arms extended upward above your chest. 2. Keep your upper arms relatively stationary and bend at the elbows. 3. Lower the bar in an arc over and behind your head in a controlled manner. 4. Feel a stretch through your chest and shoulders at the bottom position. 5. Reverse the movement, extending your elbows to return to the starting position. 6. Repeat for the prescribed number of repetitions, maintaining constant tension throughout.`,

  // EX-0748: Pec Foam Rolling
  "EX-0748": `1. Position a foam roller perpendicular to your body at chest height. 2. Lie face-down over the foam roller with your arms extended, straddling the roller at chest level. 3. Using your feet for support, roll slowly across the pectoral muscles from shoulder to ribcage. 4. Move at approximately 1 inch per second, pausing on tender points for 15-30 seconds. 5. Breathe steadily and avoid holding your breath. 6. Cover the full breadth of the pectoralis major muscle. 7. Avoid rolling directly on bone or joints.`,

  // EX-1017: Smith Machine Toe Raise
  "EX-1017": `1. Position yourself in the Smith machine with the bar resting on your shoulders and your feet hip-width apart. 2. Place the balls of your feet on the platform or floor with your heels extending off an elevated surface if available. 3. Maintain an upright posture with your core engaged. 4. Rise up on your toes, lifting your heels as high as possible. 5. Hold briefly at the top, achieving full calf contraction. 6. Lower your heels back down with control, achieving a stretch at the bottom position. 7. Repeat for the prescribed number of repetitions.`,

  // EX-1190: Wide Grip Barbell Bench Press
  "EX-1190": `1. Lie flat on a bench and grasp the barbell with a grip significantly wider than shoulder-width. 2. Position your shoulder blades by retracting them into the bench, creating a stable base. 3. Plant your feet firmly and engage your core. 4. Lift the barbell off the rack and position it over your chest. 5. Lower the barbell to your chest with control, allowing your elbows to flare outward due to the wider grip. 6. Press the bar upward, extending your elbows fully. 7. Maintain constant tension throughout, repeating for the prescribed number of repetitions.`,
};

async function populateMissingInstructions() {
  console.log("Populating missing instructions for 22 exercises...\n");

  let added = 0;
  let failed = 0;

  for (const [exerciseId, instructions] of Object.entries(missingInstructions)) {
    try {
      await db.insert(exerciseOverrides).values({
        exerciseId,
        profileId: null,
        field: "instructions",
        value: instructions,
      });

      added++;
      console.log(`✓ ${exerciseId}: instructions added`);
    } catch (error) {
      failed++;
      console.error(`✗ ${exerciseId}: ${error}`);
    }
  }

  console.log(
    `\n✅ Added instructions for ${added} exercises (22 total missing instructions now complete)`
  );
  if (failed > 0) {
    console.log(`⚠️  Failed to add ${failed} instructions`);
  }

  process.exit(0);
}

populateMissingInstructions().catch((error) => {
  console.error(error);
  process.exit(1);
});
