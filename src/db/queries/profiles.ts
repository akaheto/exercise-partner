import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";

export function listProfiles() {
  return db.select().from(profiles).orderBy(asc(profiles.createdAt));
}

export async function getProfileById(id: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
  return profile ?? null;
}
