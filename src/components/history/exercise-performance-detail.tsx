// Client Component: the toLocaleDateString() calls below must run in the
// viewer's own timezone. Session dates rendering in UTC instead of local was
// a real, previously-fixed bug class (see CHANGELOG.md / FormattedDate) — a
// Server Component render would use the server's timezone instead.
"use client";

import { Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { formatWeight } from "@/components/history/format";
import type { ExerciseHistoryPoint } from "@/db/queries/history";

interface ExercisePerformanceDetailProps {
  exerciseName: string;
  history: ExerciseHistoryPoint[];
}

export function ExercisePerformanceDetail({ exerciseName, history }: ExercisePerformanceDetailProps) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        size="compact"
        title="Nothing logged yet"
        description={`Sets you record for ${exerciseName} in Workout Mode show up here.`}
      />
    );
  }

  const maxWeight = Math.max(...history.map((h) => (h.weight ? Number(h.weight) : 0)));

  const sessionMap = new Map<string, ExerciseHistoryPoint[]>();
  for (const point of history) {
    if (!sessionMap.has(point.sessionId)) {
      sessionMap.set(point.sessionId, []);
    }
    sessionMap.get(point.sessionId)!.push(point);
  }

  const mostRecentSession = history[0];

  return (
    <div className="space-y-4">
      {/* The three numbers this panel exists for — Stat renders them mono and
          tabular so the row stays optically aligned. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total sets" value={history.length} />
        <Stat label="Max weight" value={maxWeight > 0 ? formatWeight(maxWeight) : "—"} />
        <Stat
          label="Last session"
          value={mostRecentSession.date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        />
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-h3 text-foreground">Recent sessions</h3>
        {Array.from(sessionMap.entries())
          .slice(0, 10)
          .map(([sessionId, sets]) => {
            const date = sets[0].date;
            const maxSetWeight = Math.max(...sets.map((s) => (s.weight ? Number(s.weight) : 0)));
            return (
              <Card key={sessionId} size="sm">
                <CardContent className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-small font-medium text-foreground">
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })}
                    </p>
                    <p className="text-caption text-muted-foreground">{sets.length} sets</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono tabular-nums text-body font-semibold text-foreground">
                      {maxSetWeight > 0 ? formatWeight(maxSetWeight) : "—"}
                    </p>
                    {sets[0].reps ? (
                      <p className="text-caption text-muted-foreground">× {sets[0].reps}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
