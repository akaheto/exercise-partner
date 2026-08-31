import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedDate } from "@/components/ui/formatted-date";
import type { WorkoutSessionHistoryEntry } from "@/db/queries/history";

export function WorkoutSessionHistoryPanel({ sessions }: { sessions: WorkoutSessionHistoryEntry[] }) {
  if (sessions.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Past sessions ({sessions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.sessionId} className="flex items-center justify-between gap-3 py-3 text-small">
              <Link
                href={s.status === "in_progress" ? `/session/${s.sessionId}` : `/history/${s.sessionId}`}
                className="focus-ring flex items-center gap-2 text-foreground hover:underline"
              >
                {s.status === "completed" ? (
                  <CheckCircle2 className="size-4 text-success-text" aria-hidden="true" />
                ) : s.status === "in_progress" ? null : (
                  <XCircle className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
                <FormattedDate date={s.startedAt} options={{ month: "short", day: "numeric", year: "numeric" }} />
              </Link>
              {s.volume > 0 && (
                <span className="font-mono tabular-nums text-caption text-muted-foreground">
                  {Math.round(s.volume).toLocaleString()} vol
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
