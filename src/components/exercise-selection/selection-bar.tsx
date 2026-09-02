"use client";

import { useTransition } from "react";
import { Clock, Dumbbell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { estimateSelectionMinutes } from "@/domain/workout-duration";
import { createWorkoutFromSelection } from "@/app/(app)/build/actions";
import { useClearExerciseSelection, useSelectedExercises } from "./selection-context";

/**
 * Persistent tray shown whenever exercises are selected in the library, from
 * anywhere in the app (not just /exercises) — selections survive navigation
 * since the provider lives at the (app) layout level. Duration uses the
 * quick-preview model (see estimateSelectionMinutes): recommended default
 * sets per exercise, with a flat 1-minute transition between exercises
 * rather than a per-set rest calculation, since nothing has been prescribed
 * or grouped yet — the real estimate takes over once it's in the builder.
 */
export function SelectionBar() {
  const selected = useSelectedExercises();
  const clear = useClearExerciseSelection();
  const [isPending, startTransition] = useTransition();

  if (selected.length === 0) return null;

  const minutes = estimateSelectionMinutes(selected.length);

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 md:bottom-4">
      <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-overlay">
        <Dumbbell className="size-4 shrink-0 text-primary-text" aria-hidden="true" />
        <span className="text-body font-medium text-foreground">
          {selected.length} exercise{selected.length === 1 ? "" : "s"} selected
        </span>
        <span className="flex items-center gap-1 text-small text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" /> ~{minutes} min
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={clear} aria-label="Clear selection">
            <X aria-hidden="true" />
          </Button>
          <Button
            type="button"
            loading={isPending}
            loadingLabel="Creating the workout"
            onClick={() =>
              startTransition(() => createWorkoutFromSelection(selected.map((s) => s.exerciseId)))
            }
          >
            Add to workout
          </Button>
        </div>
      </div>
    </div>
  );
}
