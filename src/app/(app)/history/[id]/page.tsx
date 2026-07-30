import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { formatWeight } from "@/components/history/format";
import { SessionStatusBadge } from "@/components/history/session-status-badge";
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
  const allSets = session.exercises.flatMap((ex) => ex.sets);
  const totalVolume = computeVolume(allSets as Parameters<typeof computeVolume>[0]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <Link
        href="/history"
        className="focus-ring mb-4 inline-flex items-center gap-1 text-small text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to history
      </Link>

      <PageHeader
        title={session.workoutName}
        description={session.startedAt.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        actions={<SessionStatusBadge status={session.status} />}
        className="mb-4"
      />

      {/* What this session amounted to. These are the numbers people come back
          to a past session for, so they get the metric treatment. */}
      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Volume" value={Math.round(totalVolume).toLocaleString()} unit="weight × reps" />
          <Stat label="Sets" value={allSets.length} />
          <Stat label="Duration" value={minutes ?? "—"} unit={minutes === null ? undefined : "min"} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {session.exercises.map((ex) => {
          const volume = computeVolume(ex.sets as Parameters<typeof computeVolume>[0]);
          return (
            <Card key={ex.exerciseId}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/exercises/${ex.exerciseId}`} className="focus-ring hover:underline">
                    {ex.exerciseName}
                  </Link>
                </CardTitle>
                {volume > 0 && (
                  <p className="font-mono tabular-nums text-caption text-muted-foreground">
                    {Math.round(volume).toLocaleString()} vol
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {ex.sets.length === 0 ? (
                  <p className="text-small text-muted-foreground">No sets logged.</p>
                ) : (
                  <DataTable minWidth={320}>
                    <DataTableHead>
                      <DataTableRow>
                        <DataTableHeader>Set</DataTableHeader>
                        <DataTableHeader>Weight</DataTableHeader>
                        <DataTableHeader>Reps</DataTableHeader>
                        <DataTableHeader>Notes</DataTableHeader>
                      </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                      {ex.sets.map((s) => {
                        const weight = formatWeight(s.weight);
                        return (
                          <DataTableRow key={s.setNumber}>
                            <DataTableCell numeric>{s.setNumber}</DataTableCell>
                            <DataTableCell numeric>
                              {weight !== null ? `${weight}${s.weightUnit ?? ""}` : "—"}
                            </DataTableCell>
                            <DataTableCell numeric>{s.reps ?? "—"}</DataTableCell>
                            <DataTableCell>{s.notes ?? ""}</DataTableCell>
                          </DataTableRow>
                        );
                      })}
                    </DataTableBody>
                  </DataTable>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
