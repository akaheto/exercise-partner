"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { PersonalRecord } from "@/db/queries/history";

interface PersonalRecordsPanelProps {
  records: PersonalRecord[];
}

export function PersonalRecordsPanel({ records }: PersonalRecordsPanelProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No personal records yet. Log a workout to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((pr) => (
        <Link
          key={pr.exerciseId}
          href={`/exercises/${pr.exerciseId}`}
          className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3 text-sm transition-colors hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
        >
          <div className="flex-1">
            <p className="font-medium text-foreground">{pr.exerciseName}</p>
            <p className="text-xs text-muted-foreground">
              {pr.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-semibold text-foreground">
                {pr.weight ? `${pr.weight}${pr.weightUnit}` : "—"}
              </p>
              {pr.reps && <p className="text-xs text-muted-foreground">{pr.reps} reps</p>}
            </div>
            <TrendingUp className="size-4 text-teal-600" aria-hidden="true" />
          </div>
        </Link>
      ))}
    </div>
  );
}
