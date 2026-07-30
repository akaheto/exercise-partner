import { cookies } from "next/headers";
import { db } from "@/db/client";
import { clientErrors } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, stack, url, userAgent } = body;

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const activeProfileId = cookieStore.get("activeProfileId")?.value ?? null;

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
