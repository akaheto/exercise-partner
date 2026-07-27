import { Dumbbell, Moon, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkoutAssessment } from "@/domain/workout-assessment";

/**
 * Deterministic, rule-based — computed from what's actually in the workout
 * (see src/domain/workout-assessment.ts). Not an AI assessment; see
 * ENHANCEMENTS.docx for that as a deferred idea.
 */
export function WorkoutAssessmentPanel({ assessment }: { assessment: WorkoutAssessment }) {
  if (assessment.primaryMuscles.length === 0 && assessment.secondaryMuscles.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Dumbbell className="size-4 text-primary" aria-hidden="true" /> Muscles worked
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {assessment.primaryMuscles.map((m) => (
            <Badge key={m}>{m}</Badge>
          ))}
          {assessment.secondaryMuscles.map((m) => (
            <Badge key={m} variant="secondary">
              {m}
            </Badge>
          ))}
        </div>
        {assessment.missingRegions.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Not covered: {assessment.missingRegions.join(", ")}.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Scale className="size-4 text-primary" aria-hidden="true" /> Choosing weight
        </h2>
        <p className="text-sm text-muted-foreground">{assessment.weightRepTip}</p>
      </div>

      <div>
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Moon className="size-4 text-primary" aria-hidden="true" /> Recovery
        </h2>
        <p className="text-sm text-muted-foreground">{assessment.recoveryTip}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Rule-based, generated from this workout&apos;s exercises and rep ranges — not personalised medical or training advice.
      </p>
    </div>
  );
}
