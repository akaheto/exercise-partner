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
    <details className="group rounded-lg border border-border bg-muted/30">
      {/* The summary is the whole disclosure control, so it carries the
          padding and the 44px minimum height — not its parent. */}
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 py-2 text-small font-medium text-foreground">
        <span>Guidance ({userLevel} • {userGoal})</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>

      <div className="mx-3 mb-3 space-y-3 border-t border-border pt-3">
        {/* Prescription Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded bg-card p-2">
            <div className="text-caption text-muted-foreground">Sets</div>
            <div className="text-body font-semibold text-foreground">{sets}</div>
          </div>
          <div className="rounded bg-card p-2">
            <div className="text-caption text-muted-foreground">Reps</div>
            <div className="text-body font-semibold text-foreground">
              {repsMin}–{repsMax}
            </div>
          </div>
          {tempo && (
            <div className="rounded bg-card p-2">
              <div className="text-caption text-muted-foreground">Tempo</div>
              <div className="text-body font-semibold text-foreground">{tempo}</div>
            </div>
          )}
        </div>

        {/* Notes/Guidance */}
        {notes && (
          <div className="flex items-start gap-2 rounded bg-card p-2 text-small">
            <Lightbulb className="mt-1 size-4 shrink-0 text-info-text" aria-hidden="true" />
            <p className="text-foreground">{notes}</p>
          </div>
        )}

        {/* Why This Guidance */}
        <div className="text-caption text-muted-foreground">
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
