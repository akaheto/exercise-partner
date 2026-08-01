import { getAdminSessionStatus } from "@/app/admin/login/actions";
import { redirect } from "next/navigation";
import { readFile } from "fs/promises";
import { join } from "path";

async function getChangelog(): Promise<string> {
  const filePath = join(process.cwd(), "CHANGELOG.md");
  return readFile(filePath, "utf-8");
}

function parseChangelog(content: string): { version: string; date?: string; sections: { title: string; items: string[] }[] }[] {
  const lines = content.split("\n");
  const versions: { version: string; date?: string; sections: { title: string; items: string[] }[] }[] = [];
  let currentVersion = "";
  let currentDate = "";
  let currentSection = "";
  let currentItems: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## [")) {
      if (currentVersion && currentSection && currentItems.length > 0) {
        if (!versions.find((v) => v.version === currentVersion)) {
          versions.push({ version: currentVersion, ...(currentDate && { date: currentDate }), sections: [] });
        }
        versions
          .find((v) => v.version === currentVersion)
          ?.sections.push({ title: currentSection, items: currentItems });
      }
      // Parse version and date: "## [Unreleased] - 2026-08-01 16:01 UTC" or "## [1.0.0] - 2026-08-01"
      const match = line.match(/## \[([^\]]+)\](?:\s*-\s*(.+?))?$/);
      currentVersion = match?.[1] || "";
      currentDate = match?.[2] || "";
      currentSection = "";
      currentItems = [];
    } else if (line.startsWith("### ")) {
      if (currentSection && currentItems.length > 0) {
        if (!versions.find((v) => v.version === currentVersion)) {
          versions.push({ version: currentVersion, ...(currentDate && { date: currentDate }), sections: [] });
        }
        versions
          .find((v) => v.version === currentVersion)
          ?.sections.push({ title: currentSection, items: currentItems });
      }
      currentSection = line.replace("### ", "").trim();
      currentItems = [];
    } else if (line.startsWith("- ")) {
      currentItems.push(line.replace("- ", "").trim());
    }
  }

  if (currentVersion && currentSection && currentItems.length > 0) {
    if (!versions.find((v) => v.version === currentVersion)) {
      versions.push({ version: currentVersion, ...(currentDate && { date: currentDate }), sections: [] });
    }
    versions.find((v) => v.version === currentVersion)?.sections.push({ title: currentSection, items: currentItems });
  }

  return versions;
}

export default async function ChangelogPage() {
  const isAdmin = await getAdminSessionStatus();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const content = await getChangelog();
  const versions = parseChangelog(content);

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-h2 font-semibold text-foreground">Changelog</h1>
        <p className="text-small text-muted-foreground">Version history and notable changes</p>
      </div>

      <div className="space-y-8">
        {versions.map((version, idx) => (
          <section key={idx} className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-h3 font-semibold text-foreground">{version.version}</h2>
              {version.date && (
                <p className="text-small text-muted-foreground">{version.date}</p>
              )}
            </div>

            {version.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2 ml-4">
                <h3 className="text-body font-medium text-foreground">{section.title}</h3>
                <ul className="space-y-1 list-disc list-inside text-small text-muted-foreground">
                  {section.items.map((item, iIdx) => (
                    <li key={iIdx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
