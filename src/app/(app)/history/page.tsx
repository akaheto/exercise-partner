import Link from "next/link";
import { CheckCircle2, Clock, Dumbbell, History as HistoryIcon, PlayCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VolumeChart } from "@/components/history/volume-chart";
import { listSessionSummaries } from "@/db/queries/history";
import { getActiveProfileId } from "@/lib/active-profile";
import { groupVolumeByWeek, sessionDurationMinutes } from "@/domain/session-history";

function statusBadge(status: string) {
  if (status === "completed") {
    return (
      <Badge variant="outline" className="gap-1 border-success/30 text-success">
        <CheckCircle2 className="size-3" /> Completed
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
        <PlayCircle className="size-3" /> In progress
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <XCircle className="size-3" /> Ended early
    </Badge>
  );
}

export default async function HistoryPage() {
  const profileId = await getActiveProfileId();
  const sessions = profileId ? await listSessionSummaries(profileId) : [];

  const weeklyVolume = groupVolumeByWeek(
    sessions.filter((s) => s.status === "completed" && s.volume > 0).map((s) => ({ date: s.startedAt, volume: s.volume })),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">History</h1>
        {sessions.length > 0 && (
          <div className="flex gap-2 text-sm">
            <Link href="/history/export/csv" className="text-muted-foreground hover:text-foreground hover:underline">
              Export CSV
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/history/export/json" className="text-muted-foreground hover:text-foreground hover:underline">
              Export JSON
            </Link>
          </div>
        )}
      </div>

      {!profileId ? (
        <p className="text-sm text-muted-foreground">Choose a profile to see its history.</p>
      ) : sessions.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <HistoryIcon className="size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">No workouts logged yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Every workout you run in Workout Mode shows up here, permanently.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {weeklyVolume.length > 1 && <VolumeChart data={weeklyVolume} />}

          <div className="space-y-3">
            {sessions.map((s) => {
              const minutes = sessionDurationMinutes(s.startedAt, s.completedAt);
              const href = s.status === "in_progress" ? `/session/${s.id}` : `/history/${s.id}`;
              return (
                <Link
                  key={s.id}
                  href={href}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-foreground">{s.workoutName}</p>
                    {statusBadge(s.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {s.startedAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {minutes !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {minutes} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Dumbbell className="size-3.5" /> {s.exerciseCount} exercise{s.exerciseCount === 1 ? "" : "s"} ·{" "}
                      {s.setCount} set{s.setCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
