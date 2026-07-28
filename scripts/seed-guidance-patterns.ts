import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { guidancePatterns } from "../src/db/schema/app";

/**
 * Guidance patterns: canonical templates for each (experience_level, training_goal) combination.
 * 15 total rows: 3 levels × 5 goals.
 *
 * Patterns define standard rep ranges, RPE targets, tempo, breathing, and form cues
 * for each user profile. Exercise-specific overrides then layer on top of these patterns.
 *
 * Separation of patterns from exercises:
 * - Reduces data redundancy (1 pattern vs 1,218 exercise rows)
 * - Makes bulk updates easier (update pattern once, all exercises using it inherit the change)
 * - Enables A/B testing of different prescriptions per level/goal
 */

const PATTERNS = [
  // Beginner patterns
  {
    id: "beginner_strength",
    experienceLevel: "Beginner",
    trainingGoal: "Strength",
    recommendedSets: 3,
    recommendedRepsMin: 3,
    recommendedRepsMax: 6,
    targetRpe: 7,
    tempo: "2-0-1",
    breathingCue: "Brace before descent. Hold breath during lift. Exhale at lockout.",
    formCue: "Maintain form throughout. Prioritize controlled movement over load.",
  },
  {
    id: "beginner_hypertrophy",
    experienceLevel: "Beginner",
    trainingGoal: "Hypertrophy",
    recommendedSets: 3,
    recommendedRepsMin: 6,
    recommendedRepsMax: 12,
    targetRpe: 6,
    tempo: "2-1-1",
    breathingCue: "Exhale on exertion. Inhale on return. Maintain constant tension.",
    formCue: "Maintain form throughout. Focus on muscle connection.",
  },
  {
    id: "beginner_endurance",
    experienceLevel: "Beginner",
    trainingGoal: "Endurance",
    recommendedSets: 3,
    recommendedRepsMin: 12,
    recommendedRepsMax: 20,
    targetRpe: 4,
    tempo: "2-0-1",
    breathingCue: "Steady, rhythmic breathing. Never hold breath.",
    formCue: "Maintain form throughout. Focus on movement quality.",
  },
  {
    id: "beginner_power",
    experienceLevel: "Beginner",
    trainingGoal: "Power",
    recommendedSets: 3,
    recommendedRepsMin: 1,
    recommendedRepsMax: 5,
    targetRpe: 7,
    tempo: "0-0-X (explosive)",
    breathingCue: "Explosive power breathing. Maximum force on concentric phase.",
    formCue: "Maintain form throughout. Prioritize speed of movement.",
  },
  {
    id: "beginner_general",
    experienceLevel: "Beginner",
    trainingGoal: "General",
    recommendedSets: 3,
    recommendedRepsMin: 8,
    recommendedRepsMax: 12,
    targetRpe: 5,
    tempo: "2-0-1",
    breathingCue: "Steady breathing throughout. Exhale on exertion.",
    formCue: "Maintain form throughout. Balanced approach to all goals.",
  },

  // Intermediate patterns
  {
    id: "intermediate_strength",
    experienceLevel: "Intermediate",
    trainingGoal: "Strength",
    recommendedSets: 4,
    recommendedRepsMin: 3,
    recommendedRepsMax: 6,
    targetRpe: 8,
    tempo: "2-0-1",
    breathingCue: "Brace before descent. Hold breath during lift. Exhale at lockout.",
    formCue: "Drive hard. Prioritize progressive load increases.",
  },
  {
    id: "intermediate_hypertrophy",
    experienceLevel: "Intermediate",
    trainingGoal: "Hypertrophy",
    recommendedSets: 4,
    recommendedRepsMin: 6,
    recommendedRepsMax: 12,
    targetRpe: 7,
    tempo: "2-1-1",
    breathingCue: "Exhale on exertion. Inhale on return. Maintain constant tension.",
    formCue: "Drive hard. Mind-muscle connection. Control the eccentric phase.",
  },
  {
    id: "intermediate_endurance",
    experienceLevel: "Intermediate",
    trainingGoal: "Endurance",
    recommendedSets: 4,
    recommendedRepsMin: 12,
    recommendedRepsMax: 20,
    targetRpe: 5,
    tempo: "2-0-1",
    breathingCue: "Steady, rhythmic breathing. Never hold breath.",
    formCue: "Drive hard. Maintain steady pace. Focus on movement quality.",
  },
  {
    id: "intermediate_power",
    experienceLevel: "Intermediate",
    trainingGoal: "Power",
    recommendedSets: 4,
    recommendedRepsMin: 1,
    recommendedRepsMax: 5,
    targetRpe: 8,
    tempo: "0-0-X (explosive)",
    breathingCue: "Explosive power breathing. Maximum force on concentric phase.",
    formCue: "Drive hard. Accelerate through the full range of motion.",
  },
  {
    id: "intermediate_general",
    experienceLevel: "Intermediate",
    trainingGoal: "General",
    recommendedSets: 4,
    recommendedRepsMin: 8,
    recommendedRepsMax: 12,
    targetRpe: 6,
    tempo: "2-0-1",
    breathingCue: "Steady breathing throughout. Exhale on exertion.",
    formCue: "Drive hard. Balanced approach to all goals.",
  },

  // Advanced patterns
  {
    id: "advanced_strength",
    experienceLevel: "Advanced",
    trainingGoal: "Strength",
    recommendedSets: 5,
    recommendedRepsMin: 1,
    recommendedRepsMax: 5,
    targetRpe: 9,
    tempo: "2-0-1",
    breathingCue: "Brace aggressively. Hold breath during lift. Exhale at lockout.",
    formCue: "Perfect form under heavy load. Progressive overload focus.",
  },
  {
    id: "advanced_hypertrophy",
    experienceLevel: "Advanced",
    trainingGoal: "Hypertrophy",
    recommendedSets: 4,
    recommendedRepsMin: 6,
    recommendedRepsMax: 12,
    targetRpe: 8,
    tempo: "2-2-1",
    breathingCue: "Exhale on exertion. Inhale on return. Maximize time under tension.",
    formCue: "Perfect form under load. Eccentric control. Peak contraction hold.",
  },
  {
    id: "advanced_endurance",
    experienceLevel: "Advanced",
    trainingGoal: "Endurance",
    recommendedSets: 5,
    recommendedRepsMin: 12,
    recommendedRepsMax: 20,
    targetRpe: 6,
    tempo: "2-0-1",
    breathingCue: "Steady, rhythmic breathing. Never hold breath.",
    formCue: "Perfect form at high volume. Pace sustainability.",
  },
  {
    id: "advanced_power",
    experienceLevel: "Advanced",
    trainingGoal: "Power",
    recommendedSets: 5,
    recommendedRepsMin: 1,
    recommendedRepsMax: 5,
    targetRpe: 9,
    tempo: "0-0-X (explosive)",
    breathingCue: "Explosive power breathing. Maximum force and speed.",
    formCue: "Perfect form at high velocity. Maximal velocity focus.",
  },
  {
    id: "advanced_general",
    experienceLevel: "Advanced",
    trainingGoal: "General",
    recommendedSets: 5,
    recommendedRepsMin: 5,
    recommendedRepsMax: 10,
    targetRpe: 7,
    tempo: "2-0-1",
    breathingCue: "Steady breathing throughout. Exhale on exertion.",
    formCue: "Perfect form. Balanced, periodized approach to all goals.",
  },
];

async function seedPatterns() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Seeding guidance patterns...");

  try {
    await db.insert(guidancePatterns).values(PATTERNS);
    console.log(`✅ Added ${PATTERNS.length} guidance patterns (3 levels × 5 goals)`);
  } catch (error) {
    console.error("✗ Failed to seed patterns:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seedPatterns();
