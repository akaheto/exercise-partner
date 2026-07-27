"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Clock, Copy, Dumbbell, Play, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveWorkout, duplicateWorkout, unarchiveWorkout } from "@/app/(app)/workouts/actions";
import { startSession } from "@/app/session/actions";
import type { WorkoutSummary } from "@/db/queries/workouts";

export function WorkoutCard({ workout, archived }: { workout: WorkoutSummary; archived: boolean }) {
  const [isDuplicating, startDuplicate] = useTransition();
  const [isArchiving, startArchive] = useTransition();
  const [isStarting, startStarting] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0">
        <Link href={`/workouts/${workout.id}/edit`} className="font-semibold text-foreground hover:underline">
          {workout.name}
        </Link>
        {workout.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{workout.description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Dumbbell className="size-3.5" /> {workout.exerciseCount} exercise{workout.exerciseCount === 1 ? "" : "s"}
        </span>
        {workout.estimatedMinutes > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> ~{workout.estimatedMinutes} min
          </span>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        {!archived && workout.exerciseCount > 0 && (
          <Button size="sm" disabled={isStarting} onClick={() => startStarting(() => startSession(workout.id))} className="gap-1.5">
            <Play className="size-3.5" /> {isStarting ? "Starting…" : "Start"}
          </Button>
        )}
        <Button variant="outline" size="sm" disabled={isDuplicating} onClick={() => startDuplicate(() => duplicateWorkout(workout.id))} className="gap-1.5">
          <Copy className="size-3.5" /> {isDuplicating ? "Copying…" : "Duplicate"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isArchiving}
          onClick={() => startArchive(() => (archived ? unarchiveWorkout(workout.id) : archiveWorkout(workout.id)))}
          className="gap-1.5"
        >
          {archived ? <RotateCcw className="size-3.5" /> : <Trash2 className="size-3.5" />}
          {isArchiving ? "…" : archived ? "Restore" : "Archive"}
        </Button>
      </div>
    </div>
  );
}
