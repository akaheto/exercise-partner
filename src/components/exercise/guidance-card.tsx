import { AlertCircle, ArrowDown, Lightbulb } from "lucide-react";
import type { ExerciseGuidanceRow } from "@/domain/getExerciseGuidance";

interface GuidanceCardProps {
  guidance: ExerciseGuidanceRow;
  userLevel: string;
  userGoal: string;
}

export function GuidanceCard({ guidance, userLevel, userGoal }: GuidanceCardProps) {
  const repsDisplay = `${guidance.recommendedRepsMin}–${guidance.recommendedRepsMax}`;
  const rpeDisplay = `RPE ${guidance.targetRpe}/10`;
  const setsDisplay = `${guidance.recommendedSets} sets`;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Guidance for {userLevel} • {userGoal}
          </h3>
          <span className="text-xs text-muted-foreground">{guidance.patternId}</span>
        </div>
        <p className="text-xs text-muted-foreground">Personalized based on your experience level and training goal</p>
      </div>

      {/* Prescription Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">Sets</div>
          <div className="text-lg font-semibold text-foreground">{setsDisplay}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">Reps</div>
          <div className="text-lg font-semibold text-foreground">{repsDisplay}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">Intensity</div>
          <div className="text-lg font-semibold text-foreground">{rpeDisplay}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">Tempo</div>
          <div className="text-lg font-semibold text-foreground">{guidance.tempo}</div>
        </div>
      </div>

      {/* Breathing & Form Cues */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="text-xs font-semibold text-foreground">Breathing</div>
        <p className="text-sm text-foreground">{guidance.breathingCue}</p>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="text-xs font-semibold text-foreground">Form Cue</div>
        <p className="text-sm text-foreground">
          {guidance.exerciseSpecificFormCue || guidance.formCue}
        </p>
      </div>

      {/* Beginner Safety Cue */}
      {userLevel === "Beginner" && guidance.beginnerSafetyCue && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-yellow-600" />
            <div>
              <div className="text-xs font-semibold text-foreground">Beginner Safety</div>
              <p className="text-sm text-foreground">{guidance.beginnerSafetyCue}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobility Requirement */}
      {guidance.requiredMobility && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <div>
              <div className="text-xs font-semibold text-foreground">Mobility Required</div>
              <p className="text-sm text-foreground capitalize">{guidance.requiredMobility} mobility needed</p>
            </div>
          </div>
        </div>
      )}

      {/* Contraindications */}
      {guidance.contraindicatedFor && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
            <div>
              <div className="text-xs font-semibold text-foreground">Avoid If</div>
              <p className="text-sm text-foreground capitalize">{guidance.contraindicatedFor.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Regression Tiers */}
      {(guidance.regressionTier1ExerciseId || guidance.regressionTier2ExerciseId || guidance.regressionTier3ExerciseId) && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="text-xs font-semibold text-foreground">Regression Tiers (If Too Difficult)</div>
          <div className="space-y-1.5">
            {guidance.regressionTier1ExerciseId && (
              <div className="flex items-start gap-2 text-sm">
                <ArrowDown className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Tier 1: {guidance.regressionTier1ExerciseId}</div>
                  {guidance.regressionTier1Note && (
                    <p className="text-xs text-muted-foreground">{guidance.regressionTier1Note}</p>
                  )}
                </div>
              </div>
            )}
            {guidance.regressionTier2ExerciseId && (
              <div className="flex items-start gap-2 text-sm">
                <ArrowDown className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Tier 2: {guidance.regressionTier2ExerciseId}</div>
                  {guidance.regressionTier2Note && (
                    <p className="text-xs text-muted-foreground">{guidance.regressionTier2Note}</p>
                  )}
                </div>
              </div>
            )}
            {guidance.regressionTier3ExerciseId && (
              <div className="flex items-start gap-2 text-sm">
                <ArrowDown className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Tier 3: {guidance.regressionTier3ExerciseId}</div>
                  {guidance.regressionTier3Note && (
                    <p className="text-xs text-muted-foreground">{guidance.regressionTier3Note}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipment Alternatives */}
      {(guidance.alternative1ExerciseId || guidance.alternative2ExerciseId) && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="text-xs font-semibold text-foreground">Equipment Alternatives</div>
          <div className="space-y-1.5">
            {guidance.alternative1ExerciseId && (
              <div className="text-sm">
                <div className="font-medium text-foreground">{guidance.alternative1ExerciseId}</div>
                {guidance.alternative1Note && (
                  <p className="text-xs text-muted-foreground">{guidance.alternative1Note}</p>
                )}
              </div>
            )}
            {guidance.alternative2ExerciseId && (
              <div className="text-sm">
                <div className="font-medium text-foreground">{guidance.alternative2ExerciseId}</div>
                {guidance.alternative2Note && (
                  <p className="text-xs text-muted-foreground">{guidance.alternative2Note}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
