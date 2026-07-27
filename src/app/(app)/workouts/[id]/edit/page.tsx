import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { AddExerciseButton } from "@/components/workout-builder/add-exercise-button";
import { BlockList } from "@/components/workout-builder/block-list";
import { WorkoutMetaForm } from "@/components/workout-builder/workout-meta-form";
import { getWorkoutForEdit } from "@/db/queries/workouts";
import { getSubstitutionCandidates } from "@/db/queries/exercises";
import { getActiveProfileId } from "@/lib/active-profile";
import { estimateWorkoutMinutes } from "@/domain/workout-duration";
import type { PickerExercise } from "./actions";

export default async function WorkoutBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await getActiveProfileId();
  if (!profileId) notFound();

  const workout = await getWorkoutForEdit(id, profileId);
  if (!workout) notFound();

  const allExerciseIds = [...new Set(workout.blocks.flatMap((b) => b.items.map((i) => i.exerciseId)))];
  const candidateEntries = await Promise.all(
    allExerciseIds.map(async (exerciseId) => {
      const rows = await getSubstitutionCandidates(exerciseId);
      const candidates: PickerExercise[] = rows.map((r) => ({
        exerciseId: r.exerciseId,
        name: r.name,
        thumbnailUrl: r.thumbnailUrl,
        primaryMuscle: r.primaryMuscle,
        equipment: r.equipment,
      }));
      return [exerciseId, candidates] as const;
    }),
  );
  const substitutionCandidates = new Map(candidateEntries);

  const minutes = estimateWorkoutMinutes(
    workout.blocks.map((b) => ({ restSeconds: b.restSeconds, items: b.items.map((i) => ({ sets: i.sets })) })),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <Link href="/workouts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to workouts
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <WorkoutMetaForm workoutId={workout.id} name={workout.name} description={workout.description} />
        {minutes > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" /> ~{minutes} min
          </span>
        )}
      </div>

      <BlockList workoutId={workout.id} blocks={workout.blocks} substitutionCandidates={substitutionCandidates} />

      <div className="mt-4">
        <AddExerciseButton workoutId={workout.id} />
      </div>
    </div>
  );
}
