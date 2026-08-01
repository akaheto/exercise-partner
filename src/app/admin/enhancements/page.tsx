import { getAdminSessionStatus } from "@/app/admin/login/actions";
import { redirect } from "next/navigation";

interface Enhancement {
  title: string;
  date?: string;
  priority?: string;
  status?: string;
}

interface EnhancementsData {
  implemented: Enhancement[];
  planned: Enhancement[];
  backlog: Enhancement[];
}

async function getEnhancements(): Promise<EnhancementsData> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const res = await fetch(`${baseUrl}/enhancements.json`);
  if (!res.ok) throw new Error("Failed to fetch enhancements");
  return res.json();
}

export default async function EnhancementsPage() {
  const isAdmin = await getAdminSessionStatus();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const enhancements = await getEnhancements();

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-h2 font-semibold text-foreground">Enhancements</h1>
        <p className="text-small text-muted-foreground">Product roadmap and feature status</p>
      </div>

      {/* Implemented */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-h3 font-semibold text-foreground">Implemented</h2>
          <p className="text-small text-muted-foreground">Completed features</p>
        </div>
        <div className="space-y-2">
          {enhancements.implemented.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                {item.date && <p className="text-small text-muted-foreground">{item.date}</p>}
              </div>
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-small font-medium text-accent-foreground">
                Done
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Planned */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-h3 font-semibold text-foreground">Planned</h2>
          <p className="text-small text-muted-foreground">Next features in development</p>
        </div>
        <div className="space-y-2">
          {enhancements.planned.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                {item.priority && <p className="text-small text-muted-foreground">Priority: {item.priority}</p>}
              </div>
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-small font-medium text-muted-foreground">
                In Progress
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Backlog */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-h3 font-semibold text-foreground">Backlog</h2>
          <p className="text-small text-muted-foreground">Future ideas and blocked items</p>
        </div>
        <div className="space-y-2">
          {enhancements.backlog.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                {item.status && <p className="text-small text-muted-foreground">Status: {item.status}</p>}
              </div>
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-small font-medium text-muted-foreground">
                {item.status || "Backlog"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
