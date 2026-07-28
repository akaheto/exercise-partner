import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Users, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveProfileId } from "@/lib/active-profile";
import { getAllProfilesWithStats } from "@/db/queries/admin";
import { ProfileDeleteButton } from "@/components/admin/profile-delete-button";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const ADMIN_SESSION_COOKIE = "admin_session";

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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="mt-2 text-muted-foreground">Manage profiles and user data</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-right text-xs text-muted-foreground">
                <p>Authenticated ✓</p>
              </div>
              <AdminLogoutButton />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
              <Users className="size-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <LogOut className="size-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.filter((p) => p.lastActivityDate).length}</div>
              <p className="text-xs text-muted-foreground">with recent activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
              <Users className="size-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.reduce((sum, p) => sum + p.workoutCount, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Profiles Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Profiles</CardTitle>
            <CardDescription>Manage all profiles and their data</CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No profiles created yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Level</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Goal</th>
                      <th className="px-4 py-3 text-center font-medium text-foreground">Workouts</th>
                      <th className="px-4 py-3 text-center font-medium text-foreground">Sessions</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Last Activity</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Created</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{profile.displayName}</div>
                          {profile.id === activeProfileId && (
                            <Badge className="mt-1 bg-teal-600 text-white">Active</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{profile.experienceLevel}</td>
                        <td className="px-4 py-3 text-muted-foreground">{profile.trainingGoal}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{profile.workoutCount}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{profile.sessionCount}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {profile.lastActivityDate
                            ? profile.lastActivityDate.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "No activity"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {profile.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ProfileDeleteButton profileId={profile.id} profileName={profile.displayName} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <p className="text-sm font-semibold text-green-900 dark:text-green-100">✓ Secure Connection</p>
          <p className="mt-2 text-sm text-green-800 dark:text-green-200">
            This admin page is protected by two-factor authentication (site password + admin token). Your session will expire
            in 4 hours. Always logout when finished.
          </p>
        </div>
      </div>
    </div>
  );
}
