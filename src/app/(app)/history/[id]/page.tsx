import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSessionDetail } from "@/db/queries/history";
import { getActiveProfileId } from "@/lib/active-profile";
import { computeVolume, sessionDurationMinutes } from "@/domain/session-history";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await getActiveProfileId();
  if (!profileId) notFound();

  const session = await getSessionDetail(id, profileId);
  if (!session) notFound();

  const minutes = sessionDurationMinutes(session.startedAt, session.completedAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <Link href="/history" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to history
      </Link>

      <div className="mb-2 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">{session.workoutName}</h1>
        {session.status === "completed" ? (
          <Badge variant="outline" className="gap-1 border-success/30 text-success">
            <CheckCircle2 className="size-3" /> Completed
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <XCircle className="size-3" /> Ended early
          </Badge>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {session.startedAt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
        {minutes !== null && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {minutes} min
          </span>
        )}
      </div>

      <div className="space-y-4">
        {session.exercises.map((ex) => {
          const volume = computeVolume(ex.sets);
          return (
            <div key={ex.exerciseId} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <Link href={`/exercises/${ex.exerciseId}`} className="font-semibold text-foreground hover:underline">
                  {ex.exerciseName}
                </Link>
                {volume > 0 && <span className="font-mono text-xs text-muted-foreground">{Math.round(volume).toLocaleString()} vol</span>}
              </div>
              {ex.sets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sets logged.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pb-1 font-normal">Set</th>
                      <th className="pb-1 font-normal">Weight</th>
                      <th className="pb-1 font-normal">Reps</th>
                      <th className="pb-1 font-normal">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {ex.sets.map((s) => (
                      <tr key={s.setNumber} className="border-t border-border/60">
                        <td className="py-1.5 text-foreground">{s.setNumber}</td>
                        <td className="py-1.5 text-foreground">{s.weight !== null ? `${s.weight}${s.weightUnit ?? ""}` : "—"}</td>
                        <td className="py-1.5 text-foreground">{s.reps ?? "—"}</td>
                        <td className="py-1.5 font-sans text-muted-foreground">{s.notes ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
