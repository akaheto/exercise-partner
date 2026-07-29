import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Users } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { getActiveProfileId } from "@/lib/active-profile";
import { getAllProfilesWithStats } from "@/db/queries/admin";
import { ProfileDeleteButton } from "@/components/admin/profile-delete-button";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const ADMIN_SESSION_COOKIE = "admin_session";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export default async function AdminPage() {
  // Check admin session cookie
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!adminSession || adminSession.value !== "authenticated") {
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
                        {profile.lastActivityDate
                          ? profile.lastActivityDate.toLocaleDateString(undefined, DATE_FORMAT)
                          : "No activity"}
                      </DataTableCell>
                      <DataTableCell align="end">
                        {profile.createdAt.toLocaleDateString(undefined, DATE_FORMAT)}
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

        <Callout tone="warning" title="This gate is weaker than it looks">
          The admin session cookie is not signed, so anyone who can already reach the site can grant
          themselves access here without the admin token. Treat it as a convenience for the site
          owner, not as a barrier between users, and do not expose this deployment publicly until
          that is fixed. Your session expires 4 hours after sign-in.
        </Callout>
      </div>
    </div>
  );
}
