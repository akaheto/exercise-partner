"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { workouts } from "@/db/schema";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";

/** Creates an empty draft workout for the active profile and jumps straight
 * into the builder. There's no "start from scratch" form — a workout with no
 * exercises yet is a perfectly normal starting state. */
export async function startNewWorkout(): Promise<void> {
  await requireSiteSession();

  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");

  const [workout] = await db.insert(workouts).values({ profileId, name: "New workout" }).returning();

  redirect(`/workouts/${workout.id}/edit`);
}
