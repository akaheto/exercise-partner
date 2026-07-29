"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Dumbbell, GripVertical, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { ExercisePickerDialog } from "./exercise-picker-dialog";
import { ExerciseItemGuidance } from "@/components/workout/exercise-item-guidance";
import {
  removeItem,
  substituteExercise,
  updateItemPrescription,
  type PickerExercise,
} from "@/app/(app)/workouts/[id]/edit/actions";
import type { WorkoutItemForEdit } from "@/db/queries/workouts";
import type { ExerciseGuidanceRow } from "@/domain/getExerciseGuidance";

export function ItemRow({
  item,
  substitutionCandidates,
  guidance,
  userLevel,
  userGoal,
}: {
  item: WorkoutItemForEdit;
  substitutionCandidates: PickerExercise[];
  guidance?: ExerciseGuidanceRow | null;
  userLevel?: string;
  userGoal?: string;
}) {
  const [sets, setSets] = useState(item.sets);
  const [repsMin, setRepsMin] = useState(item.repsMin ?? "");
  const [repsMax, setRepsMax] = useState(item.repsMax ?? "");
  const [restSeconds, setRestSeconds] = useState(item.restSeconds ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [isSaving, startSave] = useTransition();

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
    // The prescription controls sit at 44px and no longer fit beside the
    // exercise name inside a max-w-3xl card, so the row stacks at every width
    // rather than collapsing the name to zero and overlapping it.
    <div className="flex flex-col gap-3 border-t border-border p-3 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.exerciseThumbnail ? (
            <Image src={item.exerciseThumbnail} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Dumbbell className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
        <a href={`/exercises/${item.exerciseId}`} target="_blank" rel="noopener noreferrer" className="min-w-0">
          <p className="truncate text-body font-medium text-foreground hover:underline">{item.exerciseName}</p>
        </a>
      </div>

      {/* Every control here is a primary editing control, not a dense table
          cell, so they all sit at the 44px minimum (Input/Button `default`). */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-caption text-muted-foreground">
          Sets
          <Input
            type="number"
            min={1}
            max={20}
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            onBlur={save}
            className="w-20"
          />
        </label>
        <label className="flex items-center gap-1 text-caption text-muted-foreground">
          Reps
          <Input
            type="number"
            min={1}
            value={repsMin}
            onChange={(e) => setRepsMin(e.target.value)}
            onBlur={save}
            className="w-20"
            placeholder="min"
          />
          <span aria-hidden="true">–</span>
          <Input
            type="number"
            min={1}
            value={repsMax}
            onChange={(e) => setRepsMax(e.target.value)}
            onBlur={save}
            className="w-20"
            placeholder="max"
          />
        </label>
        <label className="flex items-center gap-1 text-caption text-muted-foreground">
          Rest (s)
          <Input
            type="number"
            min={0}
            step={5}
            value={restSeconds}
            onChange={(e) => setRestSeconds(e.target.value)}
            onBlur={save}
            className="w-20"
          />
        </label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={save}
          placeholder="Notes"
          className="w-40"
          aria-label="Notes"
        />
        {isSaving && (
          <span role="status" className="text-caption text-muted-foreground">
            Saving…
          </span>
        )}

        <ExercisePickerDialog
          trigger={
            <Button type="button" variant="ghost" size="icon" aria-label={`Substitute ${item.exerciseName}`}>
              <Repeat aria-hidden="true" />
            </Button>
          }
          title="Substitute exercise"
          description="Pick a replacement — suggestions are ranked by similarity."
          initialResults={substitutionCandidates}
          onSelect={(exerciseId) => substituteExercise(item.id, exerciseId)}
        />

        {/* Removing an exercise also drops its sets, reps, rest and notes, and
            empties the block if it was the last one. Not an undoable click. */}
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="destructive-quiet"
              size="icon"
              aria-label={`Remove ${item.exerciseName}`}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          }
          title={`Remove “${item.exerciseName}”?`}
          description="Its sets, reps, rest and notes go with it. Sessions you've already logged are unaffected."
          confirmLabel="Remove"
          onConfirm={() => removeItem(item.id)}
        />
      </div>

      {guidance && userLevel && userGoal && (
        <div>
          <ExerciseItemGuidance
            sets={sets}
            repsMin={Number(repsMin)}
            repsMax={Number(repsMax)}
            tempo={guidance.tempo}
            notes={notes || undefined}
            userLevel={userLevel}
            userGoal={userGoal}
          />
        </div>
      )}
    </div>
  );
}
