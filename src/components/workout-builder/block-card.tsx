"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercisePickerDialog } from "./exercise-picker-dialog";
import { ItemRow } from "./item-row";
import { addExerciseToBlock, updateBlockKind, updateBlockRest, type PickerExercise } from "@/app/(app)/workouts/[id]/edit/actions";
import type { WorkoutBlockForEdit } from "@/db/queries/workouts";

const KIND_LABEL: Record<string, string> = { single: "Exercise", superset: "Superset", circuit: "Circuit" };

export function BlockCard({
  block,
  substitutionCandidates,
}: {
  block: WorkoutBlockForEdit;
  substitutionCandidates: Map<string, PickerExercise[]>;
}) {
  const [isSavingRest, startSaveRest] = useTransition();
  const [isChangingKind, startChangeKind] = useTransition();

  function saveRest(value: string) {
    const formData = new FormData();
    formData.set("restSeconds", value);
    startSaveRest(() => updateBlockRest(block.id, formData));
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <Badge variant={block.kind === "single" ? "outline" : "default"}>{KIND_LABEL[block.kind] ?? block.kind}</Badge>

        {block.items.length > 1 && (
          <div className="flex overflow-hidden rounded-lg border border-input">
            {(["superset", "circuit"] as const).map((kind) => (
              <Button
                key={kind}
                type="button"
                size="sm"
                variant={block.kind === kind ? "secondary" : "ghost"}
                className="rounded-none border-0"
                disabled={isChangingKind}
                onClick={() => startChangeKind(() => updateBlockKind(block.id, kind))}
              >
                {KIND_LABEL[kind]}
              </Button>
            ))}
          </div>
        )}

        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          Rest between rounds (s)
          <Input
            type="number"
            min={0}
            step={5}
            defaultValue={block.restSeconds ?? 60}
            onBlur={(e) => saveRest(e.target.value)}
            className="h-9 w-16"
          />
          {isSavingRest && <span>Saving…</span>}
        </label>
      </div>

      <div>
        {block.items.map((item) => (
          <ItemRow key={item.id} item={item} substitutionCandidates={substitutionCandidates.get(item.exerciseId) ?? []} />
        ))}
      </div>

      <div className="border-t border-border p-2">
        <ExercisePickerDialog
          trigger={
            <Button type="button" variant="ghost" size="sm" className="gap-1.5">
              <Plus className="size-3.5" /> Add to this block
            </Button>
          }
          title="Add exercise to block"
          description="Grouped exercises are performed back-to-back as a superset or circuit."
          onSelect={(exerciseId) => addExerciseToBlock(block.id, exerciseId)}
        />
      </div>
    </div>
  );
}
