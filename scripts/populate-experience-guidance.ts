import { db } from "../src/db/client";
import { exerciseGuidance, sourceExercises } from "../src/db/schema";

/**
 * Populate experience-level-specific guidance for all exercises.
 *
 * For each exercise and each experience level (Beginner, Intermediate, Advanced),
 * generate:
 * - Recommended sets and rep ranges
 * - Target RPE (rate of perceived exertion)
 * - Tempo (eccentric-isometric-concentric)
 * - Breathing cues
 * - Regression options for beginners
 *
 * Data is pattern-based, driven by exercise classification (movement pattern, type, etc.)
 */

interface GuidanceTemplate {
  beginner: GuidanceLevel;
  intermediate: GuidanceLevel;
  advanced: GuidanceLevel;
}

interface GuidanceLevel {
  sets: number;
  repsMin: number;
  repsMax: number;
  targetRpe: number;
  tempo: string;
  breathingCue: string;
  formCue: string;
  modificationNote: string;
}

// Guidance templates by movement pattern/type
const guidanceByPattern: Record<string, GuidanceTemplate> = {
  // Compound movements - heavy focus
  horizontalPush: {
    beginner: {
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 7,
      tempo: "2-0-1",
      breathingCue: "Inhale as you lower the bar. Exhale forcefully as you press.",
      formCue: "Keep shoulder blades retracted. Elbows at 45 degrees.",
      modificationNote:
        "Use dumbbells or machine if barbell feels unstable. Start with lighter weight.",
    },
    intermediate: {
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      targetRpe: 8,
      tempo: "3-0-1",
      breathingCue: "Inhale down, big exhale on the press.",
      formCue: "Control the eccentric. Maintain full scapular retraction.",
      modificationNote:
        "Add 2-3 extra sets if energy permits. Focus on bar speed consistency.",
    },
    advanced: {
      sets: 5,
      repsMin: 3,
      repsMax: 8,
      targetRpe: 9,
      tempo: "3-1-1",
      breathingCue: "Hold breath at bottom for isometric strength.",
      formCue: "Pause 1 second at chest. Drive explosively.",
      modificationNote:
        "Use pause reps or band resistance. Single-arm variations for balance development.",
    },
  },

  // Vertical Push
  verticalPush: {
    beginner: {
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 7,
      tempo: "2-0-1",
      breathingCue: "Inhale as you lower to shoulders. Exhale as you press overhead.",
      formCue: "Press straight up, not forward. Brace core and glutes.",
      modificationNote: "Use lighter dumbbells. Machine press is a good regression.",
    },
    intermediate: {
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      targetRpe: 8,
      tempo: "2-1-1",
      breathingCue: "Full breath at top, controlled exhale on descent.",
      formCue: "Achieve full lockout. Shoulders stable, not shrugging.",
      modificationNote: "Add weight weekly if hitting 10 reps consistently.",
    },
    advanced: {
      sets: 4,
      repsMin: 3,
      repsMax: 6,
      targetRpe: 9,
      tempo: "3-0-1",
      breathingCue: "Power breath: big inhale, explosive press.",
      formCue: "Strict form. Full lockout and control.",
      modificationNote: "Single-arm variations for unilateral strength.",
    },
  },

  // Horizontal Pull
  horizontalPull: {
    beginner: {
      sets: 3,
      repsMin: 10,
      repsMax: 15,
      targetRpe: 7,
      tempo: "2-1-1",
      breathingCue: "Exhale as you pull elbows back. Inhale as you return.",
      formCue: "Initiate with back muscles, not arms. Squeeze shoulder blades.",
      modificationNote: "Focus on muscle connection. Lighter weight, perfect form.",
    },
    intermediate: {
      sets: 4,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 8,
      tempo: "2-1-1",
      breathingCue: "Explosive pull, controlled return.",
      formCue: "Elbows travel past midline. Chest approaches bar.",
      modificationNote: "Heavier weight. Add tempo or pause reps.",
    },
    advanced: {
      sets: 5,
      repsMin: 5,
      repsMax: 8,
      targetRpe: 9,
      tempo: "3-1-2",
      breathingCue: "Controlled breathing throughout. Explosive pull.",
      formCue: "Full range from dead arm to maximal retraction.",
      modificationNote:
        "Single-arm rows for unilateral strength. Add weight or resistance.",
    },
  },

  // Vertical Pull
  verticalPull: {
    beginner: {
      sets: 3,
      repsMin: 8,
      repsMax: 15,
      targetRpe: 7,
      tempo: "2-1-2",
      breathingCue: "Exhale as you pull down. Inhale as bar returns.",
      formCue: "Full extension at bottom. Lead with chest, not hands.",
      modificationNote:
        "Use assisted machine or resistance bands if needed. Build strength gradually.",
    },
    intermediate: {
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      targetRpe: 8,
      tempo: "2-1-1",
      breathingCue: "Explosive pull, controlled descent.",
      formCue: "Strict form. Control the eccentric (lowering) phase.",
      modificationNote: "Add weight when hitting 10 reps. Reduce band assistance.",
    },
    advanced: {
      sets: 5,
      repsMin: 3,
      repsMax: 8,
      targetRpe: 9,
      tempo: "2-0-1",
      breathingCue: "Powerful pull. Controlled descent.",
      formCue: "Weighted vest or belt for added resistance.",
      modificationNote: "Single-leg variations. High-rep drop sets.",
    },
  },

  // Squat
  squat: {
    beginner: {
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 7,
      tempo: "2-1-1",
      breathingCue: "Big breath at top. Hold during descent. Exhale as you stand.",
      formCue: "Knees track over toes. Chest up. Weight in heels.",
      modificationNote: "Bodyweight squats or goblet squat with light dumbbell.",
    },
    intermediate: {
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      targetRpe: 8,
      tempo: "2-1-1",
      breathingCue: "Steady breathing. Brace before descent.",
      formCue: "Full range of motion. Parallel or below.",
      modificationNote: "Add weight. Build consistency.",
    },
    advanced: {
      sets: 5,
      repsMin: 3,
      repsMax: 6,
      targetRpe: 9,
      tempo: "3-1-1",
      breathingCue: "Power breathing: big breath, brace, explosive up.",
      formCue: "Deep squats. Explosive ascent.",
      modificationNote: "Pause squats. Chain or band resistance.",
    },
  },

  // Hinge
  hinge: {
    beginner: {
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 7,
      tempo: "2-1-1",
      breathingCue: "Breath at top. Descend with control. Drive up with exhale.",
      formCue: "Neutral spine throughout. Bar close to body.",
      modificationNote: "Light weight. Focus on form, not load.",
    },
    intermediate: {
      sets: 4,
      repsMin: 5,
      repsMax: 8,
      targetRpe: 8,
      tempo: "2-1-1",
      breathingCue: "Big breath at top, brace, explosive pull.",
      formCue: "Strict form. Full hip extension at top.",
      modificationNote: "Progressive load increases.",
    },
    advanced: {
      sets: 5,
      repsMin: 3,
      repsMax: 5,
      targetRpe: 9,
      tempo: "2-0-1",
      breathingCue: "Valsalva maneuver: breath-hold during pull.",
      formCue: "Maximal weight with perfect form.",
      modificationNote:
        "Add pauses or chains. Deficit deadlifts for range increase.",
    },
  },

  // Carry
  carry: {
    beginner: {
      sets: 3,
      repsMin: 1,
      repsMax: 1,
      targetRpe: 7,
      tempo: "steady",
      breathingCue: "Steady breathing. Brace core throughout walk.",
      formCue: "Tall posture. Shoulders packed.",
      modificationNote: "Walk for 30-40 seconds. Light weight.",
    },
    intermediate: {
      sets: 4,
      repsMin: 1,
      repsMax: 1,
      targetRpe: 8,
      tempo: "steady",
      breathingCue: "Controlled pace. Maintain core tension.",
      formCue: "Even loading both sides. No leaning.",
      modificationNote: "Walk 40-60 seconds. Heavier weight.",
    },
    advanced: {
      sets: 5,
      repsMin: 1,
      repsMax: 1,
      targetRpe: 9,
      tempo: "steady",
      breathingCue: "Powerful walk. Maximal tension.",
      formCue: "Longest distance possible with heavy load.",
      modificationNote: "Unilateral carries. Maximal load.",
    },
  },

  // Isolation exercises
  isolation: {
    beginner: {
      sets: 3,
      repsMin: 12,
      repsMax: 15,
      targetRpe: 6,
      tempo: "2-0-1",
      breathingCue: "Exhale on the working phase. Inhale on return.",
      formCue: "Focus on muscle connection. Full range of motion.",
      modificationNote: "Light weight. Perfect form priority.",
    },
    intermediate: {
      sets: 4,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 7,
      tempo: "2-1-1",
      breathingCue: "Steady breathing. Squeeze at peak contraction.",
      formCue: "Control both phases. Maintain constant tension.",
      modificationNote: "Add weight gradually. Tempo variations.",
    },
    advanced: {
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      targetRpe: 8,
      tempo: "3-1-1",
      breathingCue: "Controlled breathing. Explosive positive phase.",
      formCue: "Heavy load with strict form. Maximize contraction.",
      modificationNote: "Drop sets or pause reps. Unilateral work.",
    },
  },

  // Plyometric
  plyometric: {
    beginner: {
      sets: 3,
      repsMin: 5,
      repsMax: 8,
      targetRpe: 7,
      tempo: "explosive",
      breathingCue: "Breathe freely. Explosive on takeoff.",
      formCue: "Soft landing. Controlled deceleration.",
      modificationNote: "Lower heights. Focus on landing mechanics.",
    },
    intermediate: {
      sets: 4,
      repsMin: 5,
      repsMax: 8,
      targetRpe: 8,
      tempo: "explosive",
      breathingCue: "Power breathing. Explosive movement.",
      formCue: "Minimal ground contact time. Explosive power.",
      modificationNote: "Increased height or difficulty.",
    },
    advanced: {
      sets: 5,
      repsMin: 3,
      repsMax: 5,
      targetRpe: 9,
      tempo: "explosive",
      breathingCue: "Controlled power breathing.",
      formCue: "Maximal height/distance. Perfect landing.",
      modificationNote: "Advanced variations. Max power output.",
    },
  },

  // SMR (Self Myofascial Release)
  smr: {
    beginner: {
      sets: 1,
      repsMin: 1,
      repsMax: 1,
      targetRpe: 0,
      tempo: "slow",
      breathingCue: "Slow, deep breathing throughout.",
      formCue: "1 inch per second over muscle. Pause on tender points.",
      modificationNote: "60-90 seconds total. Light pressure.",
    },
    intermediate: {
      sets: 1,
      repsMin: 1,
      repsMax: 1,
      targetRpe: 0,
      tempo: "slow",
      breathingCue: "Steady breathing. Relax into the roll.",
      formCue: "Systematic coverage. Pause on tender areas 15-30 seconds.",
      modificationNote: "90-120 seconds. Moderate pressure.",
    },
    advanced: {
      sets: 1,
      repsMin: 1,
      repsMax: 1,
      targetRpe: 0,
      tempo: "slow",
      breathingCue: "Deep breathing to relax.",
      formCue: "Thorough coverage. Sustained pressure on tight areas.",
      modificationNote: "120+ seconds. Deep pressure.",
    },
  },

  // Warmup/Activation
  warmup: {
    beginner: {
      sets: 2,
      repsMin: 10,
      repsMax: 15,
      targetRpe: 3,
      tempo: "controlled",
      breathingCue: "Steady, natural breathing.",
      formCue: "Focus on movement quality and muscle activation.",
      modificationNote: "Light weight or bodyweight. Build connection.",
    },
    intermediate: {
      sets: 2,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 4,
      tempo: "controlled",
      breathingCue: "Maintain steady rhythm.",
      formCue: "Quality reps. Gradual intensity increase.",
      modificationNote: "Moderate intensity. Prepare for main work.",
    },
    advanced: {
      sets: 2,
      repsMin: 5,
      repsMax: 10,
      targetRpe: 5,
      tempo: "controlled",
      breathingCue: "Steady breathing throughout.",
      formCue: "Full range with purpose.",
      modificationNote: "Brief but effective. Specific to main lift.",
    },
  },

  default: {
    beginner: {
      sets: 3,
      repsMin: 10,
      repsMax: 15,
      targetRpe: 6,
      tempo: "2-0-1",
      breathingCue: "Steady breathing. Exhale on exertion.",
      formCue: "Full range of motion. Focus on technique.",
      modificationNote: "Lighter weight. Perfect form priority.",
    },
    intermediate: {
      sets: 4,
      repsMin: 8,
      repsMax: 12,
      targetRpe: 7,
      tempo: "2-1-1",
      breathingCue: "Controlled breathing throughout.",
      formCue: "Maintain constant tension.",
      modificationNote: "Progressive load increases.",
    },
    advanced: {
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      targetRpe: 8,
      tempo: "3-1-1",
      breathingCue: "Powerful breathing patterns.",
      formCue: "Strict form with heavy load.",
      modificationNote: "Advanced variations or tempo changes.",
    },
  },
};

function getGuidanceForExercise(exercise: typeof sourceExercises.$inferSelect): GuidanceTemplate {
  // Determine pattern based on exercise classification
  if (exercise.horizontalPush) return guidanceByPattern.horizontalPush;
  if (exercise.verticalPush) return guidanceByPattern.verticalPush;
  if (exercise.horizontalPull) return guidanceByPattern.horizontalPull;
  if (exercise.verticalPull) return guidanceByPattern.verticalPull;
  if (exercise.squat) return guidanceByPattern.squat;
  if (exercise.hinge) return guidanceByPattern.hinge;
  if (exercise.carry) return guidanceByPattern.carry;

  if (exercise.exerciseType === "Plyometrics") return guidanceByPattern.plyometric;
  if (exercise.exerciseType === "SMR") return guidanceByPattern.smr;
  if (exercise.exerciseType === "Warmup" || exercise.exerciseType === "Activation")
    return guidanceByPattern.warmup;

  // Check if isolation based on mechanics
  if (exercise.mechanics === "Isolation") return guidanceByPattern.isolation;

  return guidanceByPattern.default;
}

async function populateExperienceGuidance() {
  console.log("Populating experience-level-specific guidance...\n");

  const allExercises = await db.select().from(sourceExercises);

  const experienceLevels = ["Beginner", "Intermediate", "Advanced"] as const;
  let addedCount = 0;
  let failedCount = 0;

  for (const exercise of allExercises) {
    const guidance = getGuidanceForExercise(exercise);

    for (const level of experienceLevels) {
      try {
        const levelGuidance = guidance[level.toLowerCase() as keyof typeof guidance];

        await db.insert(exerciseGuidance).values({
          exerciseId: exercise.exerciseId,
          experienceLevel: level,
          recommendedSets: levelGuidance.sets,
          recommendedRepsMin: levelGuidance.repsMin,
          recommendedRepsMax: levelGuidance.repsMax,
          targetRpe: levelGuidance.targetRpe,
          tempo: levelGuidance.tempo,
          breathingCue: levelGuidance.breathingCue,
          formCue: levelGuidance.formCue,
          modificationNote: levelGuidance.modificationNote,
        });

        addedCount++;
      } catch (error) {
        failedCount++;
        console.error(
          `✗ ${exercise.exerciseId} (${level}): ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    if (addedCount % 300 === 0) {
      console.log(`✓ Added ${addedCount} guidance rows...`);
    }
  }

  console.log(`\n✅ Added ${addedCount} experience-level-specific guidance rows`);
  console.log(`   (${allExercises.length} exercises × 3 levels)`);
  if (failedCount > 0) {
    console.log(`⚠️  Failed to add ${failedCount} rows`);
  }

  process.exit(0);
}

populateExperienceGuidance().catch((error) => {
  console.error(error);
  process.exit(1);
});
