"use client";

import type { ExerciseHistoryPoint } from "@/db/queries/history";

interface ExercisePerformanceDetailProps {
  exerciseName: string;
  history: ExerciseHistoryPoint[];
}

export function ExercisePerformanceDetail({ exerciseName, history }: ExercisePerformanceDetailProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No performance history for {exerciseName}</p>
      </div>
    );
  }

  // Find max weight across all sets
  const maxWeight = Math.max(...history.map((h) => (h.weight ? Number(h.weight) : 0)));

  // Group by session
  const sessionMap = new Map<string, ExerciseHistoryPoint[]>();
  for (const point of history) {
    if (!sessionMap.has(point.sessionId)) {
      sessionMap.set(point.sessionId, []);
    }
    sessionMap.get(point.sessionId)!.push(point);
  }

  // Get most recent session to determine current best
  const mostRecentSession = history[0];
  const currentBest = maxWeight;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Total Sets</p>
          <p className="text-2xl font-bold text-foreground">{history.length}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Max Weight</p>
          <p className="text-2xl font-bold text-foreground">{currentBest > 0 ? currentBest : "—"}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Last Session</p>
          <p className="text-sm font-medium text-foreground">
            {mostRecentSession.date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Session History */}
      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">Recent Sessions</h3>
        {Array.from(sessionMap.entries())
          .slice(0, 10)
          .map(([sessionId, sets]) => {
            const date = sets[0].date;
            const maxSetWeight = Math.max(...sets.map((s) => (s.weight ? Number(s.weight) : 0)));
            return (
              <div key={sessionId} className="rounded-lg border border-border bg-card p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{sets.length} sets</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{maxSetWeight > 0 ? maxSetWeight : "—"}</p>
                    {sets[0].reps && <p className="text-xs text-muted-foreground">× {sets[0].reps}</p>}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
