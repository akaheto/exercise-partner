import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import type { WorkoutSessionHistoryEntry } from "@/db/queries/history";

export function WorkoutSessionHistoryPanel({ sessions }: { sessions: WorkoutSessionHistoryEntry[] }) {
  if (sessions.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        Past sessions ({sessions.length})
      </h2>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {sessions.map((s) => (
          <li key={s.sessionId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <Link
              href={s.status === "in_progress" ? `/session/${s.sessionId}` : `/history/${s.sessionId}`}
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              {s.status === "completed" ? (
                <CheckCircle2 className="size-3.5 text-success" />
              ) : s.status === "in_progress" ? null : (
                <XCircle className="size-3.5 text-muted-foreground" />
              )}
              {s.startedAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </Link>
            {s.volume > 0 && <span className="font-mono text-xs text-muted-foreground">{Math.round(s.volume).toLocaleString()} vol</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
