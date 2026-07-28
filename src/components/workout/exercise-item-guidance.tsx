"use client";

import { ChevronDown, Lightbulb } from "lucide-react";

interface ExerciseItemGuidanceProps {
  sets: number;
  repsMin: number;
  repsMax: number;
  tempo?: string;
  notes?: string;
  userLevel: string;
  userGoal: string;
}

export function ExerciseItemGuidance({
  sets,
  repsMin,
  repsMax,
  tempo,
  notes,
  userLevel,
  userGoal,
}: ExerciseItemGuidanceProps) {
  return (
    <details className="group rounded-lg border border-border bg-muted/30 p-3">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-foreground">
        <span>Guidance ({userLevel} • {userGoal})</span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-3 space-y-3 border-t border-border pt-3">
        {/* Prescription Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded bg-card p-2">
            <div className="text-xs text-muted-foreground">Sets</div>
            <div className="font-semibold text-foreground">{sets}</div>
          </div>
          <div className="rounded bg-card p-2">
            <div className="text-xs text-muted-foreground">Reps</div>
            <div className="font-semibold text-foreground">
              {repsMin}–{repsMax}
            </div>
          </div>
          {tempo && (
            <div className="rounded bg-card p-2">
              <div className="text-xs text-muted-foreground">Tempo</div>
              <div className="font-semibold text-foreground">{tempo}</div>
            </div>
          )}
        </div>

        {/* Notes/Guidance */}
        {notes && (
          <div className="flex items-start gap-2 rounded bg-card p-2 text-sm">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-foreground">{notes}</p>
          </div>
        )}

        {/* Why This Guidance */}
        <div className="text-xs text-muted-foreground">
          <p>
            Personalized for <strong>{userLevel}</strong> experience level with <strong>{userGoal}</strong> training goal.{" "}
            <a href="/profile" className="underline hover:text-foreground">
              Update your profile
            </a>{" "}
            to change guidance.
          </p>
        </div>
      </div>
    </details>
  );
}
