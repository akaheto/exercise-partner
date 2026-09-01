"use server";

import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { equipmentInventory, workoutBlocks, workoutItems, workouts } from "@/db/schema";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";
import { fetchCandidatePool } from "@/db/queries/generator";
import { getExerciseGuidance } from "@/db/queries/exercises";
import { generateWorkout } from "@/domain/generator/generate";
import { DURATION_OPTIONS, EXPERIENCE_LEVELS, FOCUS_AREAS, GOALS } from "@/domain/generator/types";

const FOCUS_LABELS: Record<(typeof FOCUS_AREAS)[number], string> = {
  full_body: "Full Body",
  upper_body: "Upper Body",
  lower_body: "Lower Body",
  push: "Push",
  pull: "Pull",
  core: "Core",
};

export interface GenerateWorkoutState {
  error?: string;
  warnings?: string[];
}

const schema = z.object({
  goal: z.enum(GOALS),
  durationMinutes: z.coerce.number().refine((v) => (DURATION_OPTIONS as readonly number[]).includes(v)),
  focus: z.enum(FOCUS_AREAS),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
});

export async function generateWorkoutAction(
  _prevState: GenerateWorkoutState,
  formData: FormData,
): Promise<GenerateWorkoutState> {
  await requireSiteSession();

  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");

  const parsed = schema.safeParse({
    goal: formData.get("goal"),
    durationMinutes: formData.get("durationMinutes"),
    focus: formData.get("focus"),
    experienceLevel: formData.get("experienceLevel"),
  });
  if (!parsed.success) {
    return { error: "Answer every question before generating a workout." };
  }

  const allEquipmentIds = formData.getAll("allEquipmentId").map(String);
  const selectedEquipmentIds = new Set(formData.getAll("equipmentId").map(String));

  // Persist the full equipment inventory state — every submission is a
  // complete snapshot of what the profile has access to right now.
  if (allEquipmentIds.length > 0) {
    await db
      .insert(equipmentInventory)
      .values(
        allEquipmentIds.map((equipmentId) => ({
          profileId,
          equipmentId,
          status: selectedEquipmentIds.has(equipmentId) ? "have" : "no",
        })),
      )
      .onConflictDoUpdate({
        target: [equipmentInventory.profileId, equipmentInventory.equipmentId],
        set: { status: sql`excluded.status` },
      });
  }

  const selectedEquipmentNames = formData.getAll("equipmentName").map(String);
  const pool = await fetchCandidatePool(selectedEquipmentNames);

  const result = generateWorkout({
    goal: parsed.data.goal,
    durationMinutes: parsed.data.durationMinutes,
    focus: parsed.data.focus,
    experienceLevel: parsed.data.experienceLevel,
    candidates: pool,
  });

  if (result.items.length === 0) {
    return { error: "Couldn't generate a workout — no exercises matched your equipment and experience level.", warnings: result.warnings };
  }

  // The wizard's own choice for this generation governs the prescription
  // and guidance cues too, not the profile's default — a one-off "generate
  // this harder than usual" workout should stay consistently harder, not
  // silently fall back to the profile's real level. Stored on the workout
  // itself (below) so it stays that way even after the profile's default
  // changes later — see src/domain/workout-guidance-context.ts.
  const userLevel = parsed.data.experienceLevel;

  // Map goal names to guidance pattern training goals (lowercase to Title case)
  const goalMap: Record<typeof parsed.data.goal, string> = {
    strength: "Strength",
    hypertrophy: "Hypertrophy",
    endurance: "Endurance",
    general: "General",
  };
  const guidanceGoal = goalMap[parsed.data.goal];

  const workout = await db.transaction(async (tx) => {
    const [w] = await tx
      .insert(workouts)
      .values({
        profileId,
        name: `${FOCUS_LABELS[parsed.data.focus]} Workout`,
        description: `Generated for ${parsed.data.goal}, ~${parsed.data.durationMinutes} min, ${parsed.data.experienceLevel.toLowerCase()} level.`,
        experienceLevel: userLevel,
        trainingGoal: guidanceGoal,
      })
      .returning();

    for (const [index, item] of result.items.entries()) {
      // Look up guidance for this exercise based on user's level + goal
      const guidance = await getExerciseGuidance(item.exerciseId, userLevel, guidanceGoal);

      // Use guidance if available, otherwise fall back to generated prescription
      const sets = guidance?.recommendedSets ?? item.sets;
      const repsMin = guidance?.recommendedRepsMin ?? item.repsMin;
      const repsMax = guidance?.recommendedRepsMax ?? item.repsMax;
      const restSeconds = guidance ? Math.round(guidance.targetRpe * 20) : item.restSeconds; // RPE-based rest calculation

      const [block] = await tx
        .insert(workoutBlocks)
        .values({ workoutId: w.id, position: index, kind: "single", restSeconds })
        .returning();
      await tx.insert(workoutItems).values({
        blockId: block.id,
        exerciseId: item.exerciseId,
        position: 0,
        sets,
        repsMin,
        repsMax,
        notes: guidance?.tempo ? `Tempo: ${guidance.tempo}` : undefined,
      });
    }

    return w;
  });

  redirect(`/workouts/${workout.id}/edit`);
}
