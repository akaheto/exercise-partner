"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
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
        weight: weight.trim() ? Number(weight) : null,
        weightUnit: weight.trim() ? weightUnit : null,
        reps: reps.trim() ? Number(reps) : null,
        notes: notes.trim() || null,
      });
      setReps("");
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

  function handleAbandon() {
    startTransition(async () => {
      await abandonSession(sessionId);
    });
  }

  const setsDone = nextSetNumber - 1;
  const instructionSentences = splitIntoSentences(exercise?.instructions ?? null);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{workoutName}</p>
          <p className="text-xs font-medium text-muted-foreground">
            Exercise {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="End workout">
                <X />
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End this workout?</DialogTitle>
              <DialogDescription>
                Sets you&apos;ve already logged stay saved. You can&apos;t resume this session once it&apos;s ended.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Keep going</Button>} />
              <Button variant="destructive" disabled={isPending} onClick={handleAbandon}>
                End workout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="mb-1 flex gap-1">
        {steps.map((s, i) => (
          <div
            key={s.itemId}
            className={
              "h-1.5 flex-1 rounded-full " +
              (i < currentStepIndex ? "bg-primary" : i === currentStepIndex ? "bg-primary/50" : "bg-muted")
            }
          />
        ))}
      </div>

      <h1 className="mt-4 text-3xl font-bold text-foreground">{step.exerciseName}</h1>
      {step.exercisePrimaryMuscle && <p className="mt-1 text-sm text-muted-foreground">{step.exercisePrimaryMuscle}</p>}

      <p className="mt-4 font-mono text-lg text-foreground">
        Set {nextSetNumber} of {step.sets}
        {step.repsMin !== null && step.repsMax !== null && (
          <span className="text-muted-foreground"> · {step.repsMin}–{step.repsMax} reps</span>
        )}
      </p>

      {isResting ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Resting</p>
          <p className="font-mono text-5xl font-semibold tabular-nums text-foreground">{formatRestTime(remainingRestMs)}</p>
          <Button variant="outline" size="lg" onClick={() => setRestUntil(null)}>
            Skip rest
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="weight" className="mb-1.5 block text-xs text-muted-foreground">
                Weight
              </Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="h-14 font-mono text-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="shrink-0 px-3 font-mono"
                  onClick={() => setWeightUnit((u) => (u === "kg" ? "lb" : "kg"))}
                >
                  {weightUnit}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="reps" className="mb-1.5 block text-xs text-muted-foreground">
                Reps
              </Label>
              <Input
                id="reps"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="0"
                className="h-14 font-mono text-xl"
              />
            </div>
          </div>

          <Button size="lg" className="h-14 w-full text-base" disabled={isPending} onClick={handleLogSet}>
            Log set {nextSetNumber}
          </Button>

          {setsDone > 0 && (
            <Button variant="ghost" size="sm" disabled={isPending} onClick={handleUndo} className="w-full">
              Undo last set
            </Button>
          )}
        </div>
      )}

      {exercise && (
        <div className="mt-8 space-y-6">
          <VideoEmbed videoUrl={exercise.videoUrl} sourceUrl={exercise.sourceUrl} />
          {instructionSentences.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Instructions</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
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
