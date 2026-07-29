"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NumberStepper } from "@/components/ui/number-stepper";
import { VideoEmbed } from "@/components/exercise/video-embed";
import { MuscleDiagram } from "@/components/exercise/muscle-diagram";
import { splitIntoSentences } from "@/domain/text";
import { DEFAULT_REST_SECONDS } from "@/domain/workout-duration";
import type { SessionStep } from "@/domain/session-flow";
import { abandonSession, deleteLastSet, logSet } from "@/app/session/actions";

interface ExerciseDetail {
  instructions: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  secondaryMuscles: string[];
}

/**
 * Stepper increments for weight, per unit.
 *
 * VISUAL_STYLE_GUIDE.docx section 4: "Numeric entry during a workout uses
 * steppers with large +/− targets alongside direct entry." The step only
 * earns its keep if it matches how plates actually load, so it follows the
 * unit rather than being a fixed 1: 2.5kg is the smallest common pair of
 * plates, 5lb its imperial equivalent. Reps step by 1.
 */
const WEIGHT_STEP: Record<"kg" | "lb", number> = { kg: 2.5, lb: 5 };

function formatRestTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SessionRunner({
  sessionId,
  workoutName,
  steps,
  currentStepIndex,
  nextSetNumber,
  exercise,
  defaultWeightUnit,
}: {
  sessionId: string;
  workoutName: string;
  steps: SessionStep[];
  currentStepIndex: number;
  nextSetNumber: number;
  exercise: ExerciseDetail | null;
  defaultWeightUnit: "kg" | "lb";
}) {
  const step: SessionStep = steps[currentStepIndex];
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">(defaultWeightUnit);
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (restUntil === null) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [restUntil]);

  const remainingRestMs = restUntil && now ? Math.max(0, restUntil - now) : 0;
  const isResting = restUntil !== null && remainingRestMs > 0;

  function handleLogSet() {
    const restSeconds = step.restSeconds ?? DEFAULT_REST_SECONDS;
    startTransition(async () => {
      await logSet(sessionId, {
        exerciseId: step.exerciseId,
        setNumber: nextSetNumber,
        weight,
        // A unit without a weight would be meaningless on the row.
        weightUnit: weight === null ? null : weightUnit,
        reps,
        notes: notes.trim() || null,
      });
      // Weight deliberately carries over to the next set; reps do not.
      setReps(null);
      setNotes("");
      if (restSeconds > 0) {
        const start = Date.now();
        setNow(start);
        setRestUntil(start + restSeconds * 1000);
      }
    });
  }

  function handleUndo() {
    setRestUntil(null);
    startTransition(async () => {
      await deleteLastSet(sessionId, step.exerciseId);
    });
  }

  const setsDone = nextSetNumber - 1;
  const otherUnit = weightUnit === "kg" ? "lb" : "kg";
  const instructionSentences = splitIntoSentences(exercise?.instructions ?? null);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <p className="truncate text-caption text-muted-foreground">{workoutName}</p>
          <p className="text-caption font-medium text-muted-foreground">
            Exercise {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
        {/* Leaving Workout Mode is confirmed, never a single tap — the exit
            sits next to controls used mid-set with sweaty hands. */}
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label="End workout">
              <X />
            </Button>
          }
          title="End this workout?"
          description="Sets you've already logged stay saved. You can't resume this session once it's ended."
          confirmLabel="End workout"
          cancelLabel="Keep going"
          onConfirm={() => abandonSession(sessionId)}
        />
      </header>

      <div className="mb-1 flex gap-1">
        {steps.map((s, i) => (
          <div
            key={s.itemId}
            className={
              "h-2 flex-1 rounded-full " +
              (i < currentStepIndex ? "bg-primary" : i === currentStepIndex ? "bg-primary/50" : "bg-muted")
            }
          />
        ))}
      </div>

      <h1 className="mt-4 text-display text-foreground">{step.exerciseName}</h1>
      {step.exercisePrimaryMuscle && <p className="mt-1 text-body text-muted-foreground">{step.exercisePrimaryMuscle}</p>}

      <p className="mt-4 text-metric text-foreground">
        Set {nextSetNumber} of {step.sets}
        {step.repsMin !== null && step.repsMax !== null && (
          <span className="text-body font-normal tracking-normal text-muted-foreground">
            {" "}
            · {step.repsMin}–{step.repsMax} reps
          </span>
        )}
      </p>

      {isResting ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-body text-muted-foreground">Resting</p>
            <p role="timer" className="text-timer text-foreground">
              {formatRestTime(remainingRestMs)}
            </p>
            <Button variant="outline" size="workout" className="w-full" onClick={() => setRestUntil(null)}>
              Skip rest
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardContent className="space-y-4">
            {/* Steppers rather than bare fields: the failure case being
                designed against is tapping a small field and fighting the
                phone keyboard between sets. Typing still works — the field
                commits on blur or Enter. */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="weight"
                  className="text-caption font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Weight
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="font-mono"
                  aria-label={`Weight unit is ${weightUnit}. Switch to ${otherUnit}.`}
                  onClick={() => setWeightUnit((u) => (u === "kg" ? "lb" : "kg"))}
                >
                  {weightUnit}
                </Button>
              </div>
              <NumberStepper
                id="weight"
                label="Weight"
                size="workout"
                value={weight}
                onValueChange={setWeight}
                min={0}
                step={WEIGHT_STEP[weightUnit]}
                className="w-full"
                inputClassName="w-full flex-1 text-metric"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="reps"
                className="block text-caption font-semibold tracking-wide text-muted-foreground uppercase"
              >
                Reps
              </label>
              <NumberStepper
                id="reps"
                label="Reps"
                size="workout"
                value={reps}
                onValueChange={setReps}
                min={0}
                step={1}
                className="w-full"
                inputClassName="w-full flex-1 text-metric"
              />
            </div>

            <Button
              size="workout"
              className="w-full"
              loading={isPending}
              loadingLabel={`Logging set ${nextSetNumber}`}
              onClick={handleLogSet}
            >
              Log set {nextSetNumber}
            </Button>

            {/* A recovery action reached mid-workout, so it sits at the 44px
                minimum rather than the 36px dense-row size. */}
            {setsDone > 0 && (
              <Button variant="outline" disabled={isPending} onClick={handleUndo} className="w-full">
                Undo last set
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {exercise && (
        <div className="mt-8 space-y-6">
          <VideoEmbed videoUrl={exercise.videoUrl} sourceUrl={exercise.sourceUrl} />
          {instructionSentences.length > 0 && (
            <section>
              <h2 className="mb-2 text-h3 text-foreground">Instructions</h2>
              {/* Never below 16px for anything read during a workout —
                  VISUAL_STYLE_GUIDE.docx section 2. */}
              <ul className="list-disc space-y-2 pl-5 text-body-lg text-foreground">
                {instructionSentences.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          <MuscleDiagram primaryMuscle={step.exercisePrimaryMuscle} secondaryMuscles={exercise.secondaryMuscles} />
        </div>
      )}
    </div>
  );
}
