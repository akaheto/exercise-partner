import Link from "next/link";
import { Video } from "lucide-react";
import type { SourceExerciseRow } from "./types";

export function ExerciseTable({ exercises }: { exercises: SourceExerciseRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Primary muscle</th>
            <th className="px-4 py-3">Equipment</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3 text-center">Video</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <tr key={exercise.exerciseId} className="border-b border-border last:border-0 hover:bg-muted/50">
              <td className="px-4 py-3 font-medium text-foreground">
                <Link
                  href={`/exercises/${exercise.exerciseId}`}
                  className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {exercise.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{exercise.primaryMuscle}</td>
              <td className="px-4 py-3 text-muted-foreground">{exercise.equipment}</td>
              <td className="px-4 py-3 text-muted-foreground">{exercise.exerciseType}</td>
              <td className="px-4 py-3 text-muted-foreground">{exercise.experienceLevel}</td>
              <td className="px-4 py-3 text-center">
                {exercise.videoAvailable && <Video className="mx-auto size-4 text-primary" aria-label="Video available" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
