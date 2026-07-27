import Image from "next/image";
import Link from "next/link";
import { Dumbbell, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceExerciseRow } from "./types";

/**
 * Exercise card per VISUAL_STYLE_GUIDE.docx section 4: thumbnail (16:9), name,
 * primary muscle badge, equipment badge, experience level. Entire card is one
 * click target.
 */
export function ExerciseCard({ exercise }: { exercise: SourceExerciseRow }) {
  return (
    <Link
      href={`/exercises/${exercise.exerciseId}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
          <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground">
            <Video className="size-3" aria-hidden="true" /> Video
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{exercise.name}</h3>
        <div className="mt-auto flex flex-wrap gap-1.5">
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
