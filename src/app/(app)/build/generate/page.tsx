import { notFound } from "next/navigation";
import { listEquipment, listHaveEquipmentIds } from "@/db/queries/equipment";
import { getProfileById } from "@/db/queries/profiles";
import { getActiveProfileId } from "@/lib/active-profile";
import { GeneratorWizard } from "@/components/generator/generator-wizard";
import { EXPERIENCE_LEVELS, type ExperienceLevel, type Goal } from "@/domain/generator/types";

function toExperienceLevel(value: string | undefined): ExperienceLevel {
  return (EXPERIENCE_LEVELS as readonly string[]).includes(value ?? "")
    ? (value as ExperienceLevel)
    : "Beginner";
}

// profiles.trainingGoal is "Strength" | "Hypertrophy" | "Endurance" | "Power"
// | "General" (Title case, includes "Power"); the generator's own Goal type
// is a narrower, lowercase set with no "Power" equivalent — falls back to
// "general" for that case rather than leaving the wizard unset.
const TRAINING_GOAL_TO_GENERATOR_GOAL: Record<string, Goal> = {
  Strength: "strength",
  Hypertrophy: "hypertrophy",
  Endurance: "endurance",
  General: "general",
};

function toGoal(value: string | undefined): Goal {
  return TRAINING_GOAL_TO_GENERATOR_GOAL[value ?? ""] ?? "general";
}

export default async function GenerateWorkoutPage() {
  const profileId = await getActiveProfileId();
  if (!profileId) notFound();

  const [equipment, haveIds, profile] = await Promise.all([
    listEquipment(),
    listHaveEquipmentIds(profileId),
    getProfileById(profileId),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 md:px-6">
      <GeneratorWizard
        equipmentOptions={equipment}
        initialHaveIds={[...haveIds]}
        initialExperienceLevel={toExperienceLevel(profile?.experienceLevel)}
        initialGoal={toGoal(profile?.trainingGoal)}
      />
    </div>
  );
}
