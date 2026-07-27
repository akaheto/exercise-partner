import { NextResponse } from "next/server";
import { listAllSetsForExport } from "@/db/queries/history";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";
import { toExportRows } from "@/domain/export";

export async function GET() {
  await requireSiteSession();
  const profileId = await getActiveProfileId();
  if (!profileId) return new NextResponse("No active profile", { status: 400 });

  const rows = await listAllSetsForExport(profileId);
  return new NextResponse(JSON.stringify(toExportRows(rows), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="exercise-partner-history-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
