import type { ReactNode } from "react";
import { ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import type { ExerciseGuidanceRow } from "@/domain/getExerciseGuidance";

interface GuidanceCardProps {
  guidance: ExerciseGuidanceRow;
  userLevel: string;
  userGoal: string;
}

/** Sentence-case section label. Not the uppercase caption treatment — D4
 * reserves that for form field labels and Stat labels. */
function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-caption font-semibold text-foreground">{children}</p>;
}

export function GuidanceCard({ guidance, userLevel, userGoal }: GuidanceCardProps) {
  const repsDisplay = `${guidance.recommendedRepsMin}–${guidance.recommendedRepsMax}`;
  const hasRegressions =
    guidance.regressionTier1ExerciseId ||
    guidance.regressionTier2ExerciseId ||
    guidance.regressionTier3ExerciseId;
  const regressions = [
    { tier: 1, exerciseId: guidance.regressionTier1ExerciseId, note: guidance.regressionTier1Note },
    { tier: 2, exerciseId: guidance.regressionTier2ExerciseId, note: guidance.regressionTier2Note },
    { tier: 3, exerciseId: guidance.regressionTier3ExerciseId, note: guidance.regressionTier3Note },
  ].filter((r) => r.exerciseId);
  const alternatives = [
    { exerciseId: guidance.alternative1ExerciseId, note: guidance.alternative1Note },
    { exerciseId: guidance.alternative2ExerciseId, note: guidance.alternative2Note },
  ].filter((a) => a.exerciseId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Guidance for {userLevel} • {userGoal}
        </CardTitle>
        <CardDescription>Derived from your experience level and training goal, not measured for you.</CardDescription>
        <CardAction>
          <Badge variant="muted">{guidance.patternId}</Badge>
        </CardAction>
      </CardHeader>

      {/* The four numbers you act on. Stat puts them in mono tabular figures so
          the row stays aligned across exercises. */}
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Sets" value={guidance.recommendedSets} />
        <Stat label="Reps" value={repsDisplay} />
        <Stat label="Target RPE" value={`${guidance.targetRpe}/10`} />
        <Stat label="Tempo" value={guidance.tempo} />
      </CardContent>

      <CardContent className="space-y-2 border-t border-border pt-4">
        <SectionLabel>Breathing</SectionLabel>
        <p className="text-body text-foreground">{guidance.breathingCue}</p>
      </CardContent>

      <CardContent className="space-y-2 border-t border-border pt-4">
        <SectionLabel>Form cue</SectionLabel>
        <p className="text-body text-foreground">{guidance.exerciseSpecificFormCue || guidance.formCue}</p>
      </CardContent>

      {userLevel === "Beginner" && guidance.beginnerSafetyCue && (
        <CardContent>
          <Callout tone="warning" title="Beginner safety">
            {guidance.beginnerSafetyCue}
          </Callout>
        </CardContent>
      )}

      {guidance.requiredMobility && (
        <CardContent>
          <Callout tone="info" title="Mobility required">
            <p className="capitalize">{guidance.requiredMobility} mobility needed.</p>
          </Callout>
        </CardContent>
      )}

      {guidance.contraindicatedFor && (
        <CardContent>
          <Callout tone="danger" title="Avoid if">
            <p className="capitalize">{guidance.contraindicatedFor.replace(/_/g, " ")}</p>
          </Callout>
        </CardContent>
      )}

      {hasRegressions && (
        <CardContent className="space-y-2 border-t border-border pt-4">
          <SectionLabel>Regressions (if this is too hard)</SectionLabel>
          <div className="space-y-2">
            {regressions.map((r) => (
              <div key={r.tier} className="flex items-start gap-2 text-small">
                <ArrowDown className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">
                    Tier {r.tier}: {r.exerciseId}
                  </p>
                  {r.note && <p className="text-caption text-muted-foreground">{r.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {alternatives.length > 0 && (
        <CardContent className="space-y-2 border-t border-border pt-4">
          <SectionLabel>Equipment alternatives</SectionLabel>
          <div className="space-y-2">
            {alternatives.map((a) => (
              <div key={a.exerciseId} className="text-small">
                <p className="font-medium text-foreground">{a.exerciseId}</p>
                {a.note && <p className="text-caption text-muted-foreground">{a.note}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
