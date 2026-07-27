import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionRunner } from "@/components/session/session-runner";
import { getSessionForRunning } from "@/db/queries/sessions";
import { getExerciseById } from "@/db/queries/exercises";
import { getActiveProfile } from "@/lib/active-profile";
import { buildSessionSteps, computeSessionProgress } from "@/domain/session-flow";
import { parseMuscleList } from "@/domain/importParsing";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getActiveProfile();
  if (!profile) notFound();

  const session = await getSessionForRunning(id, profile.id);
  if (!session) notFound();

  if (session.status !== "in_progress") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        {session.status === "completed" ? (
          <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
        ) : (
          <XCircle className="size-12 text-muted-foreground" aria-hidden="true" />
        )}
        <h1 className="text-xl font-semibold text-foreground">
          {session.status === "completed" ? "Workout complete" : "Workout ended"}
        </h1>
        <p className="text-sm text-muted-foreground">{session.snapshot.name}</p>
        <Link href="/workouts" className={cn(buttonVariants({ size: "lg" }), "mt-2")}>
          Back to workouts
        </Link>
      </div>
    );
  }

  const steps = buildSessionSteps(session.snapshot);
  const progress = computeSessionProgress(steps, session.loggedSets);

  if (progress.isComplete) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">All sets logged</h1>
        <p className="text-sm text-muted-foreground">
          {session.snapshot.name} — {session.loggedSets.length} set{session.loggedSets.length === 1 ? "" : "s"} recorded.
        </p>
        <SessionFinishButton sessionId={session.id} />
      </div>
    );
  }

  const currentStep = steps[progress.currentStepIndex];
  const exercise = await getExerciseById(currentStep.exerciseId, profile.id);
  const secondaryMuscles = parseMuscleList(exercise?.secondaryMuscles ?? null);

  return (
    <SessionRunner
      sessionId={session.id}
      workoutName={session.snapshot.name}
      steps={steps}
      currentStepIndex={progress.currentStepIndex}
      nextSetNumber={progress.nextSetNumber}
      exercise={
        exercise
          ? {
              instructions: exercise.instructions,
              videoUrl: exercise.videoUrl,
              sourceUrl: exercise.url,
              secondaryMuscles,
            }
          : null
      }
      defaultWeightUnit={profile.preferredWeightUnit === "lb" ? "lb" : "kg"}
    />
  );
}

function SessionFinishButton({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const { completeSession } = await import("@/app/session/actions");
        await completeSession(sessionId);
      }}
    >
      <Button type="submit" size="lg" className="mt-2">
        Finish workout
      </Button>
    </form>
  );
}
