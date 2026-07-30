import { db } from "@/db/client";
import { clientErrors } from "@/db/schema";
import { getAdminSessionStatus } from "@/app/admin/login/actions";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";

export default async function ErrorsPage() {
  const isAdmin = await getAdminSessionStatus();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const errors = await db.select().from(clientErrors).orderBy(desc(clientErrors.timestamp));

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-h2 font-semibold text-foreground">Client Errors</h1>
        <p className="text-small text-muted-foreground">
          Errors logged from user sessions ({errors.length} total)
        </p>
      </div>

      {errors.length === 0 ? (
        <p className="text-small text-muted-foreground">No errors logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Timestamp</th>
                <th className="px-4 py-2 text-left font-medium">Message</th>
                <th className="px-4 py-2 text-left font-medium">URL</th>
                <th className="px-4 py-2 text-left font-medium">Profile</th>
                <th className="px-4 py-2 text-left font-medium">Stack</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error) => (
                <tr key={error.id} className="border-b border-border">
                  <td className="px-4 py-2">
                    {error.timestamp?.toLocaleDateString()} {error.timestamp?.toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">{error.message}</td>
                  <td className="px-4 py-2 max-w-xs truncate text-muted-foreground">{error.url}</td>
                  <td className="px-4 py-2 text-muted-foreground">{error.profileId || "—"}</td>
                  <td className="px-4 py-2">
                    {error.stack && (
                      <details className="cursor-pointer">
                        <summary className="text-primary">View</summary>
                        <pre className="mt-2 bg-muted p-2 rounded text-caption overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
