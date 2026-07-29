"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Clock, Copy, Dumbbell, Play, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { archiveWorkout, duplicateWorkout, unarchiveWorkout } from "@/app/(app)/workouts/actions";
import { startSession } from "@/app/session/actions";
import type { WorkoutSummary } from "@/db/queries/workouts";

export function WorkoutCard({ workout, archived }: { workout: WorkoutSummary; archived: boolean }) {
  const [isDuplicating, startDuplicate] = useTransition();
  const [isRestoring, startRestore] = useTransition();
  const [isStarting, startStarting] = useTransition();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Link href={`/workouts/${workout.id}/edit`} className="hover:underline">
            {workout.name}
          </Link>
        </CardTitle>
        {workout.description && (
          <p className="line-clamp-2 text-small text-muted-foreground">{workout.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
        <span className="flex items-center gap-1">
          <Dumbbell className="size-4" aria-hidden="true" /> {workout.exerciseCount} exercise
          {workout.exerciseCount === 1 ? "" : "s"}
        </span>
        {workout.estimatedMinutes > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="size-4" aria-hidden="true" /> ~{workout.estimatedMinutes} min
          </span>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex-wrap gap-2">
        {!archived && workout.exerciseCount > 0 && (
          <Button
            loading={isStarting}
            loadingLabel="Starting the workout"
            onClick={() => startStarting(() => startSession(workout.id))}
          >
            <Play aria-hidden="true" /> Start
          </Button>
        )}
        <Button
          variant="outline"
          loading={isDuplicating}
          loadingLabel="Copying the workout"
          onClick={() => startDuplicate(() => duplicateWorkout(workout.id))}
        >
          <Copy aria-hidden="true" /> Duplicate
        </Button>
        {archived ? (
          <Button
            variant="ghost"
            loading={isRestoring}
            loadingLabel="Restoring the workout"
            onClick={() => startRestore(() => unarchiveWorkout(workout.id))}
          >
            <RotateCcw aria-hidden="true" /> Restore
          </Button>
        ) : (
          // Archiving is reversible, but it takes the workout off the list the
          // user is looking at and the trigger wears a bin icon. Confirm it.
          <ConfirmDialog
            trigger={
              <Button variant="destructive-quiet">
                <Trash2 aria-hidden="true" /> Archive
              </Button>
            }
            title={`Archive “${workout.name}”?`}
            description="It leaves your workout list. Sessions you've already logged keep it, and you can bring it back from Show archived."
            confirmLabel="Archive"
            onConfirm={() => archiveWorkout(workout.id)}
          />
        )}
      </CardFooter>
    </Card>
  );
}
