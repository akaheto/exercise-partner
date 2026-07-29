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
import { GripVertical, ListPlus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
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
        // size-11 is the 44px touch minimum. The drag listeners are unchanged;
        // only the hit area grew, so dnd-kit behaves exactly as before.
        className="focus-ring flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      {/* min-w-0: a flex item defaults to min-width:auto, which lets a long
          exercise name push the card past the viewport instead of truncating. */}
      <div className="min-w-0 flex-1">
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
      <EmptyState
        size="compact"
        icon={ListPlus}
        title="No exercises in this workout"
        description="Add one below. You can group exercises into a superset or circuit once there is more than one."
        className="rounded-xl border border-dashed border-border"
      />
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
