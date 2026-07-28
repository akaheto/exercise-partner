"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Dumbbell, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useExerciseSelection } from "@/components/exercise-selection/selection-context";
import type { SourceExerciseRow } from "./types";

/**
 * Exercise card per VISUAL_STYLE_GUIDE.docx section 4: thumbnail (16:9), name,
 * primary muscle badge, equipment badge, experience level. Entire card is one
 * click target for viewing the exercise; the checkbox overlay is a separate
 * target for multi-select (stops propagation so it never triggers navigation).
 */
export function ExerciseCard({ exercise }: { exercise: SourceExerciseRow }) {
  const { isSelected, toggle } = useExerciseSelection();
  const selected = isSelected(exercise.exerciseId);

  return (
    <Link
      href={`/exercises/${exercise.exerciseId}`}
      className={cn(
        "group focus-ring flex flex-col overflow-hidden rounded-xl border bg-card shadow-flat transition-colors hover:border-primary/50",
        selected ? "border-primary" : "border-border",
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {exercise.thumbnailUrl ? (
          <Image
            src={exercise.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Dumbbell className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        {exercise.videoAvailable && (
          <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-caption font-medium text-foreground">
            <Video className="size-3" aria-hidden="true" /> Video
          </span>
        )}
        {/* 44px hit area (VISUAL_STYLE_GUIDE.docx touch-target minimum) with a
            28px visual mark, so the control stays small on a thumbnail without
            being small to hit. */}
        <button
          type="button"
          aria-label={selected ? `Remove ${exercise.name} from selection` : `Select ${exercise.name}`}
          aria-pressed={selected}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle({ exerciseId: exercise.exerciseId, name: exercise.name });
          }}
          className="group/select focus-ring absolute top-0 left-0 flex size-11 items-center justify-center"
        >
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full border-2 transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-background/80 bg-background/60 text-transparent group-hover/select:bg-background/90",
            )}
          >
            <Check className="size-4" aria-hidden="true" />
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-body font-semibold text-foreground">{exercise.name}</h3>
        <div className="mt-auto flex flex-wrap gap-2">
          {exercise.primaryMuscle && <Badge variant="secondary">{exercise.primaryMuscle}</Badge>}
          {exercise.equipment && <Badge variant="outline">{exercise.equipment}</Badge>}
          {exercise.experienceLevel && (
            <Badge variant="outline" className="text-muted-foreground">
              {exercise.experienceLevel}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
