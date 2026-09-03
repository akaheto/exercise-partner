import { ChevronDown, Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WorkoutCard } from "@/components/workout-library/workout-card";
import type { WorkoutSummary } from "@/db/queries/workouts";

/** One collapsed-by-default section per Workout Library program (Epic Q5),
 * grouping the several day-workouts "Add to my workouts" creates so the
 * list doesn't read as a wall of near-identical cards. Native <details> —
 * same disclosure pattern as exercise-item-guidance.tsx, no client
 * component needed for the toggle itself. */
export function WorkoutProgramGroup({
  sourceProgramName,
  workouts,
  archived,
}: {
  sourceProgramName: string;
  workouts: WorkoutSummary[];
  archived: boolean;
}) {
  return (
    <details className="group rounded-xl border border-border bg-card">
      {/* The summary is the whole disclosure control, so it carries the
          padding and the 44px minimum height — not its parent. */}
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-body font-medium text-foreground">
        <span className="flex items-center gap-2">
          <Library className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {sourceProgramName}
          <Badge variant="outline" className="text-caption">
            {workouts.length} day{workouts.length === 1 ? "" : "s"}
          </Badge>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="grid grid-cols-1 gap-4 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
        {workouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} archived={archived} />
        ))}
      </div>
    </details>
  );
}
