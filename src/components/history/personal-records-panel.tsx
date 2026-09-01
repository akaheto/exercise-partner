// Client Component: the toLocaleDateString() call below must run in the
// viewer's own timezone. Session dates rendering in UTC instead of local was
// a real, previously-fixed bug class (see CHANGELOG.md / FormattedDate) — a
// Server Component render would use the server's timezone instead.
"use client";

import Link from "next/link";
import { Trophy, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatWeight } from "@/components/history/format";
import type { PersonalRecord } from "@/db/queries/history";

interface PersonalRecordsPanelProps {
  records: PersonalRecord[];
}

export function PersonalRecordsPanel({ records }: PersonalRecordsPanelProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        size="compact"
        title="No personal records yet"
        description="Once you log a set with a weight on it, your best for that exercise shows up here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {records.map((pr) => {
        const weight = formatWeight(pr.weight);
        return (
        <li key={pr.exerciseId}>
          <Link
            href={`/exercises/${pr.exerciseId}`}
            className="focus-ring flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:border-primary hover:bg-accent"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-medium text-foreground">{pr.exerciseName}</p>
              <p className="text-caption text-muted-foreground">
                {pr.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* The weight IS the record, so it gets the metric treatment:
                  mono, tabular, so a column of PRs lines up. */}
              <div className="text-right">
                <p className="flex items-baseline justify-end gap-1">
                  <span className="text-metric text-foreground">{weight ?? "—"}</span>
                  {weight && pr.weightUnit ? (
                    <span className="text-small text-muted-foreground">{pr.weightUnit}</span>
                  ) : null}
                </p>
                {pr.reps ? <p className="text-caption text-muted-foreground">{pr.reps} reps</p> : null}
              </div>
              <TrendingUp className="size-4 shrink-0 text-primary-text" aria-hidden="true" />
            </div>
          </Link>
        </li>
        );
      })}
    </ul>
  );
}
