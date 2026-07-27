"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Dumbbell, GripVertical, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercisePickerDialog } from "./exercise-picker-dialog";
import {
  removeItem,
  substituteExercise,
  updateItemPrescription,
  type PickerExercise,
} from "@/app/(app)/workouts/[id]/edit/actions";
import type { WorkoutItemForEdit } from "@/db/queries/workouts";

export function ItemRow({
  item,
  substitutionCandidates,
}: {
  item: WorkoutItemForEdit;
  substitutionCandidates: PickerExercise[];
}) {
  const [sets, setSets] = useState(item.sets);
  const [repsMin, setRepsMin] = useState(item.repsMin ?? "");
  const [repsMax, setRepsMax] = useState(item.repsMax ?? "");
  const [restSeconds, setRestSeconds] = useState(item.restSeconds ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [isSaving, startSave] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  function save() {
    const formData = new FormData();
    formData.set("sets", String(sets));
    formData.set("repsMin", String(repsMin));
    formData.set("repsMax", String(repsMax));
    formData.set("restSeconds", String(restSeconds));
    formData.set("notes", String(notes));
    startSave(() => updateItemPrescription(item.id, formData));
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border p-3 first:border-t-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.exerciseThumbnail ? (
            <Image src={item.exerciseThumbnail} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Dumbbell className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <a href={`/exercises/${item.exerciseId}`} target="_blank" rel="noopener noreferrer" className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground hover:underline">{item.exerciseName}</p>
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          Sets
          <Input
            type="number"
            min={1}
            max={20}
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            onBlur={save}
            className="h-9 w-16"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          Reps
          <Input
            type="number"
            min={1}
            value={repsMin}
            onChange={(e) => setRepsMin(e.target.value)}
            onBlur={save}
            className="h-9 w-14"
            placeholder="min"
          />
          <span aria-hidden="true">–</span>
          <Input
            type="number"
            min={1}
            value={repsMax}
            onChange={(e) => setRepsMax(e.target.value)}
            onBlur={save}
            className="h-9 w-14"
            placeholder="max"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          Rest (s)
          <Input
            type="number"
            min={0}
            step={5}
            value={restSeconds}
            onChange={(e) => setRestSeconds(e.target.value)}
            onBlur={save}
            className="h-9 w-16"
          />
        </label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={save}
          placeholder="Notes"
          className="h-9 w-32"
          aria-label="Notes"
        />
        {isSaving && <span className="text-xs text-muted-foreground">Saving…</span>}

        <ExercisePickerDialog
          trigger={
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Substitute exercise">
              <Repeat className="size-3.5" />
            </Button>
          }
          title="Substitute exercise"
          description="Pick a replacement — suggestions are ranked by similarity."
          initialResults={substitutionCandidates}
          onSelect={(exerciseId) => substituteExercise(item.id, exerciseId)}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove exercise"
          disabled={isRemoving}
          onClick={() => startRemove(() => removeItem(item.id))}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
