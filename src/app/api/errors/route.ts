import { cookies } from "next/headers";
import { db } from "@/db/client";
import { clientErrors } from "@/db/schema";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/active-profile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, stack, url, userAgent } = body;

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    // Was hardcoded as "activeProfileId" (camelCase) — the real cookie is
    // ACTIVE_PROFILE_COOKIE ("active_profile_id"), so this always read
    // undefined and every logged error silently lost its profile
    // association. Found while reviewing the admin errors page; the
    // client_errors table has 0 rows so far, so nothing needs backfilling.
    const activeProfileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value ?? null;

    await db.insert(clientErrors).values({
      profileId: activeProfileId,
      message,
      stack: stack ?? null,
      url: url ?? null,
      userAgent: userAgent ?? null,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error logging client error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
