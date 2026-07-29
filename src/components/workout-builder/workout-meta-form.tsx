"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkoutMeta } from "@/app/(app)/workouts/[id]/edit/actions";

export function WorkoutMetaForm({
  workoutId,
  name,
  description,
}: {
  workoutId: string;
  name: string;
  description: string | null;
}) {
  const [nameValue, setNameValue] = useState(name);
  const [descriptionValue, setDescriptionValue] = useState(description ?? "");
  const [isSaving, startSave] = useTransition();

  function save() {
    const formData = new FormData();
    formData.set("name", nameValue);
    formData.set("description", descriptionValue);
    startSave(() => updateWorkoutMeta(workoutId, formData));
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="workout-name" className="sr-only">
          Workout name
        </Label>
        <Input
          id="workout-name"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={save}
          className="h-auto min-h-11 border-none px-0 font-heading text-h1 shadow-none focus-visible:ring-0"
          placeholder="Workout name"
        />
      </div>
      <div>
        <Label htmlFor="workout-description" className="sr-only">
          Description
        </Label>
        <Input
          id="workout-description"
          value={descriptionValue}
          onChange={(e) => setDescriptionValue(e.target.value)}
          onBlur={save}
          placeholder="Optional description"
          className="border-none px-0 text-small text-muted-foreground shadow-none focus-visible:ring-0"
        />
      </div>
      {isSaving && (
        <p role="status" className="text-caption text-muted-foreground">
          Saving…
        </p>
      )}
    </div>
  );
}
