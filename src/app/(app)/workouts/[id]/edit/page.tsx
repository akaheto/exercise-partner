import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Play } from "lucide-react";
import { AddExerciseButton } from "@/components/workout-builder/add-exercise-button";
import { BlockList } from "@/components/workout-builder/block-list";
import { WorkoutMetaForm } from "@/components/workout-builder/workout-meta-form";
import { WorkoutAssessmentPanel } from "@/components/workout-assessment/workout-assessment-panel";
import { WorkoutSessionHistoryPanel } from "@/components/history/workout-session-history-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkoutForEdit } from "@/db/queries/workouts";
import { getSubstitutionCandidates, getExerciseGuidance } from "@/db/queries/exercises";
import { getWorkoutSessionHistory } from "@/db/queries/history";
import { getProfileById } from "@/db/queries/profiles";
import { getActiveProfileId } from "@/lib/active-profile";
import { estimateWorkoutMinutes } from "@/domain/workout-duration";
import { assessWorkout } from "@/domain/workout-assessment";
import { parseMuscleList } from "@/domain/importParsing";
import { startSession } from "@/app/session/actions";
import type { PickerExercise } from "./actions";

export default async function WorkoutBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await getActiveProfileId();
  if (!profileId) notFound();

  const [workout, profile] = await Promise.all([
    getWorkoutForEdit(id, profileId),
    getProfileById(profileId),
  ]);
  if (!workout) notFound();

  const userLevel = profile?.experienceLevel || "Beginner";
  const userGoal = profile?.trainingGoal || "General";

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

  // Fetch guidance data for all exercises
  const guidanceEntries = await Promise.all(
    allExerciseIds.map(async (exerciseId) => {
      const guidance = await getExerciseGuidance(exerciseId, userLevel, userGoal);
      return [exerciseId, guidance] as const;
    }),
  );
  const guidanceMap = new Map(guidanceEntries);

  const sessionHistory = await getWorkoutSessionHistory(id, profileId);

  const minutes = estimateWorkoutMinutes(
    workout.blocks.map((b) => ({ restSeconds: b.restSeconds, items: b.items.map((i) => ({ sets: i.sets })) })),
  );

  const allItems = workout.blocks.flatMap((b) => b.items);
  const assessment = assessWorkout(
    allItems.map((i) => ({
      primaryMuscle: i.exercisePrimaryMuscle,
      secondaryMuscles: parseMuscleList(i.exerciseSecondaryMuscles),
      bodyRegion: i.exerciseBodyRegion,
      repsMin: i.repsMin,
      repsMax: i.repsMax,
    })),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <Link
        href="/workouts"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-small text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to workouts
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <WorkoutMetaForm workoutId={workout.id} name={workout.name} description={workout.description} />
        <div className="flex shrink-0 items-center gap-2">
          {minutes > 0 && (
            <Badge variant="muted" className="gap-1">
              <Clock aria-hidden="true" /> ~{minutes} min
            </Badge>
          )}
          {allItems.length > 0 && (
            <form action={startSession.bind(null, workout.id)}>
              <Button type="submit" className="gap-2">
                <Play className="size-4" aria-hidden="true" /> Start workout
              </Button>
            </form>
          )}
        </div>
      </div>

      <BlockList
        workoutId={workout.id}
        blocks={workout.blocks}
        substitutionCandidates={substitutionCandidates}
        guidanceMap={guidanceMap}
        userLevel={userLevel}
        userGoal={userGoal}
      />

      <div className="mt-4 mb-6">
        <AddExerciseButton workoutId={workout.id} />
      </div>

      <WorkoutAssessmentPanel assessment={assessment} />
      <WorkoutSessionHistoryPanel sessions={sessionHistory} />
    </div>
  );
}
