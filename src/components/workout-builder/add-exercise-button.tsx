"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExercisePickerDialog } from "./exercise-picker-dialog";
import { addExerciseAsNewBlock } from "@/app/(app)/workouts/[id]/edit/actions";

export function AddExerciseButton({ workoutId }: { workoutId: string }) {
  return (
    <ExercisePickerDialog
      trigger={
        <Button type="button" className="gap-2">
          <Plus className="size-4" aria-hidden="true" /> Add exercise
        </Button>
      }
      title="Add an exercise"
      description="Adds a new exercise to the end of the workout."
      onSelect={(exerciseId) => addExerciseAsNewBlock(workoutId, exerciseId)}
    />
  );
}
