import Link from "next/link";
import { Clock, Dumbbell, History as HistoryIcon, TrendingUp, UserRound, Weight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormattedDate } from "@/components/ui/formatted-date";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { MuscleBalancePanel } from "@/components/history/muscle-balance-panel";
import { PersonalRecordsPanel } from "@/components/history/personal-records-panel";
import { SessionStatusBadge } from "@/components/history/session-status-badge";
import { VolumeChart } from "@/components/history/volume-chart";
import { listSessionSummaries, getPersonalRecords } from "@/db/queries/history";
import { getMuscleVolumePoints } from "@/db/queries/metrics";
import { getActiveProfileId } from "@/lib/active-profile";
import { groupVolumeByWeek, sessionDurationMinutes } from "@/domain/session-history";
import { groupMuscleVolumeByWeek, summarizeMuscleBalance } from "@/domain/training-metrics";

const MUSCLE_BALANCE_WEEKS = 4;

export default async function HistoryPage() {
  const profileId = await getActiveProfileId();
  const sessions = profileId ? await listSessionSummaries(profileId) : [];
  const personalRecords = profileId ? await getPersonalRecords(profileId) : [];

  const weeklyVolume = groupVolumeByWeek(
    sessions.filter((s) => s.status === "completed" && s.volume > 0).map((s) => ({ date: s.startedAt, volume: s.volume })),
  );

  const muscleVolumePoints = profileId ? await getMuscleVolumePoints(profileId) : [];
  const muscleBalance = summarizeMuscleBalance(groupMuscleVolumeByWeek(muscleVolumePoints), MUSCLE_BALANCE_WEEKS);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <PageHeader
        title="History"
        description="Every workout you've run, kept exactly as it was performed."
        className="mb-6"
        actions={
          sessions.length > 0 ? (
            <>
              {/* Plain links to the export route handlers — the browser
                  downloads the response. Do not swap these for buttons. */}
              <Link
                href="/history/export/csv"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Export CSV
              </Link>
              <Link
                href="/history/export/json"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Export JSON
              </Link>
            </>
          ) : undefined
        }
      />

      {!profileId ? (
        <EmptyState
          icon={UserRound}
          title="No profile selected"
          description="History belongs to a profile. Choose one and its sessions show up here."
          action={
            <Link href="/profile" className={cn(buttonVariants({ variant: "default" }))}>
              Choose a profile
            </Link>
          }
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No workouts logged yet"
          description="Every workout you run in Workout Mode shows up here, permanently."
          action={
            <Link href="/workouts" className={cn(buttonVariants({ variant: "default" }))}>
              Go to your workouts
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {weeklyVolume.length > 1 && <VolumeChart data={weeklyVolume} />}
          {muscleBalance.length > 0 && <MuscleBalancePanel entries={muscleBalance} weeks={MUSCLE_BALANCE_WEEKS} />}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary-text" aria-hidden="true" />
                Personal records
              </CardTitle>
              <CardDescription>Your heaviest logged set for each exercise.</CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalRecordsPanel records={personalRecords.slice(0, 10)} />
            </CardContent>
          </Card>

          <ul className="space-y-3">
            {sessions.map((s) => {
              const minutes = sessionDurationMinutes(s.startedAt, s.completedAt);
              const href = s.status === "in_progress" ? `/session/${s.id}` : `/history/${s.id}`;
              return (
                <li key={s.id}>
                  <Link href={href} className="focus-ring block rounded-xl">
                    <Card className="transition-shadow hover:ring-2 hover:ring-primary">
                      <CardHeader>
                        <CardTitle>{s.workoutName}</CardTitle>
                        <CardAction>
                          <SessionStatusBadge status={s.status} />
                        </CardAction>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
                        <span>
                          <FormattedDate
                            date={s.startedAt}
                            options={{ month: "short", day: "numeric", year: "numeric" }}
                          />
                        </span>
                        {minutes !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-4" aria-hidden="true" />
                            <span className="font-mono tabular-nums">{minutes}</span> min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Dumbbell className="size-4" aria-hidden="true" />
                          <span className="font-mono tabular-nums">{s.exerciseCount}</span> exercise
                          {s.exerciseCount === 1 ? "" : "s"} ·{" "}
                          <span className="font-mono tabular-nums">{s.setCount}</span> set
                          {s.setCount === 1 ? "" : "s"}
                        </span>
                        {s.volume > 0 && (
                          <span className="flex items-center gap-1">
                            <Weight className="size-4" aria-hidden="true" />
                            <span className="font-mono tabular-nums">{Math.round(s.volume).toLocaleString()}</span> vol
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
