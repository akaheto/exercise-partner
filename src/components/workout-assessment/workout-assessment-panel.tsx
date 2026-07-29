import type { ReactNode } from "react";
import { Dumbbell, Moon, Scale, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkoutAssessment } from "@/domain/workout-assessment";

/** Sentence-case section label. D4 reserves the uppercase caption treatment
 * for form field labels and Stat labels. */
function SectionHeading({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-caption font-semibold text-foreground">
      <Icon className="size-4 text-primary-text" aria-hidden="true" /> {children}
    </h2>
  );
}

/**
 * Deterministic, rule-based — computed from what's actually in the workout
 * (see src/domain/workout-assessment.ts). Not an AI assessment; see
 * ENHANCEMENTS.docx for that as a deferred idea.
 */
export function WorkoutAssessmentPanel({ assessment }: { assessment: WorkoutAssessment }) {
  if (assessment.primaryMuscles.length === 0 && assessment.secondaryMuscles.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-2">
        <SectionHeading icon={Dumbbell}>Muscles worked</SectionHeading>
        <div className="flex flex-wrap gap-2">
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
          <p className="text-small text-muted-foreground">
            Not covered: {assessment.missingRegions.join(", ")}.
          </p>
        )}
      </CardContent>

      <CardContent className="space-y-1">
        <SectionHeading icon={Scale}>Choosing weight</SectionHeading>
        <p className="text-body text-muted-foreground">{assessment.weightRepTip}</p>
      </CardContent>

      <CardContent className="space-y-1">
        <SectionHeading icon={Moon}>Recovery</SectionHeading>
        <p className="text-body text-muted-foreground">{assessment.recoveryTip}</p>
      </CardContent>

      <CardContent>
        <p className="text-caption text-muted-foreground">
          Rule-based, generated from this workout&apos;s exercises and rep ranges — not personalised
          medical or training advice.
        </p>
      </CardContent>
    </Card>
  );
}
