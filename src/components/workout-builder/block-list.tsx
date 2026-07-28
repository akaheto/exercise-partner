"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { BlockCard } from "./block-card";
import { reorderBlocks, type PickerExercise } from "@/app/(app)/workouts/[id]/edit/actions";
import type { WorkoutBlockForEdit } from "@/db/queries/workouts";
import type { ExerciseGuidanceRow } from "@/domain/getExerciseGuidance";

function SortableBlock({
  block,
  substitutionCandidates,
  guidanceMap,
  userLevel,
  userGoal,
}: {
  block: WorkoutBlockForEdit;
  substitutionCandidates: Map<string, PickerExercise[]>;
  guidanceMap: Map<string, ExerciseGuidanceRow | null>;
  userLevel: string;
  userGoal: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-start gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="mt-4 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1">
        <BlockCard
          block={block}
          substitutionCandidates={substitutionCandidates}
          guidanceMap={guidanceMap}
          userLevel={userLevel}
          userGoal={userGoal}
        />
      </div>
    </div>
  );
}

export function BlockList({
  workoutId,
  blocks,
  substitutionCandidates,
  guidanceMap,
  userLevel,
  userGoal,
}: {
  workoutId: string;
  blocks: WorkoutBlockForEdit[];
  substitutionCandidates: Map<string, PickerExercise[]>;
  guidanceMap: Map<string, ExerciseGuidanceRow | null>;
  userLevel: string;
  userGoal: string;
}) {
  const [ordered, setOrdered] = useState(blocks);
  const [syncedBlocks, setSyncedBlocks] = useState(blocks);

  // Re-sync local order when the server-fetched blocks change for a reason
  // other than our own drag (an add/remove elsewhere on the page).
  if (blocks !== syncedBlocks) {
    setSyncedBlocks(blocks);
    setOrdered(blocks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((b) => b.id === active.id);
    const newIndex = ordered.findIndex((b) => b.id === over.id);
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    void reorderBlocks(workoutId, next.map((b) => b.id));
  }

  if (ordered.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No exercises yet — add one below to get started.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ordered.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {ordered.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              substitutionCandidates={substitutionCandidates}
              guidanceMap={guidanceMap}
              userLevel={userLevel}
              userGoal={userGoal}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
