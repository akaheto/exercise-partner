import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, AlertCircle, Lightbulb, Book } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormattedDate } from "@/components/ui/formatted-date";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { getAdminSessionStatus } from "@/app/admin/login/actions";
import { getActiveProfileId } from "@/lib/active-profile";
import { getAllProfilesWithStats } from "@/db/queries/admin";
import { ProfileDeleteButton } from "@/components/admin/profile-delete-button";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export default async function AdminPage() {
  if (!(await getAdminSessionStatus())) {
    redirect("/admin/login");
  }

  const activeProfileId = await getActiveProfileId();
  const profiles = await getAllProfilesWithStats();

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
        <PageHeader
          eyebrow="Admin"
          title="Profiles"
          description="Every profile on this site, and the data belonging to it."
          actions={<AdminLogoutButton />}
        />

        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/errors" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-small font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground border border-border">
            <AlertCircle className="size-4" />
            Errors
          </Link>
          <Link href="/admin/enhancements" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-small font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground border border-border">
            <Lightbulb className="size-4" />
            Enhancements
          </Link>
          <Link href="/admin/changelog" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-small font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground border border-border">
            <Book className="size-4" />
            Changelog
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <Stat label="Profiles" value={profiles.length} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Stat
                label="With activity"
                value={profiles.filter((p) => p.lastActivityDate).length}
                caveat="Have logged at least one session"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Stat
                label="Workouts"
                value={profiles.reduce((sum, p) => sum + p.workoutCount, 0)}
                caveat="Across all profiles"
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All profiles</CardTitle>
            <CardDescription>
              Deleting a profile here does not require its PIN, and takes every workout and session
              with it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No profiles yet"
                description="Profiles appear here once someone creates one from the home page."
              />
            ) : (
              <DataTable minWidth={860}>
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeader>Name</DataTableHeader>
                    <DataTableHeader>Level</DataTableHeader>
                    <DataTableHeader>Goal</DataTableHeader>
                    <DataTableHeader align="center">Workouts</DataTableHeader>
                    <DataTableHeader align="center">Sessions</DataTableHeader>
                    <DataTableHeader>Last activity</DataTableHeader>
                    <DataTableHeader align="end">Created</DataTableHeader>
                    <DataTableHeader align="end">Actions</DataTableHeader>
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {profiles.map((profile) => (
                    <DataTableRow key={profile.id}>
                      <DataTableCell className="text-foreground">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{profile.displayName}</span>
                          {profile.id === activeProfileId && (
                            <Badge>Active</Badge>
                          )}
                        </span>
                      </DataTableCell>
                      <DataTableCell>{profile.experienceLevel}</DataTableCell>
                      <DataTableCell>{profile.trainingGoal}</DataTableCell>
                      <DataTableCell align="center" numeric>
                        {profile.workoutCount}
                      </DataTableCell>
                      <DataTableCell align="center" numeric>
                        {profile.sessionCount}
                      </DataTableCell>
                      <DataTableCell>
                        {profile.lastActivityDate ? (
                          <FormattedDate date={profile.lastActivityDate} options={DATE_FORMAT} />
                        ) : (
                          "No activity"
                        )}
                      </DataTableCell>
                      <DataTableCell align="end">
                        <FormattedDate date={profile.createdAt} options={DATE_FORMAT} />
                      </DataTableCell>
                      <DataTableCell align="end">
                        <ProfileDeleteButton
                          profileId={profile.id}
                          profileName={profile.displayName}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>

        <Callout tone="info" title="About this session">
          Your admin session is signed and expires 4 hours after sign-in. Deleting a profile here
          skips its PIN and cannot be undone.
        </Callout>
      </div>
    </div>
  );
}
