"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { ACTIVE_PROFILE_COOKIE, getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";

export interface CreateProfileState {
  error?: string;
}

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(60, "Keep it under 60 characters.");

export async function createProfile(
  _prevState: CreateProfileState,
  formData: FormData,
): Promise<CreateProfileState> {
  await requireSiteSession();

  const result = displayNameSchema.safeParse(formData.get("displayName"));
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid name." };
  }

  const [profile] = await db.insert(profiles).values({ displayName: result.data }).returning();

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profile.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  revalidatePath("/", "layout");
  return {};
}

export async function selectProfile(formData: FormData): Promise<void> {
  await requireSiteSession();

  const profileId = z.uuid().parse(formData.get("profileId"));
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  revalidatePath("/", "layout");
}

const weightUnitSchema = z.enum(["kg", "lb"]);

export async function updatePreferredWeightUnit(formData: FormData): Promise<void> {
  await requireSiteSession();

  const profileId = z.uuid().parse(formData.get("profileId"));
  const unit = weightUnitSchema.parse(formData.get("unit"));

  await db.update(profiles).set({ preferredWeightUnit: unit }).where(eq(profiles.id, profileId));

  revalidatePath("/profile");
}

const experienceLevelSchema = z.enum(["Beginner", "Intermediate", "Advanced"]);
const trainingGoalSchema = z.enum(["Strength", "Hypertrophy", "Endurance", "Power", "General"]);

export async function updateProfileAction(
  profileId: string,
  experienceLevel: string,
  trainingGoal: string
): Promise<{ success: boolean; error?: string }> {
  await requireSiteSession();

  // Validate inputs
  const levelResult = experienceLevelSchema.safeParse(experienceLevel);
  if (!levelResult.success) {
    return { success: false, error: "Invalid experience level" };
  }

  const goalResult = trainingGoalSchema.safeParse(trainingGoal);
  if (!goalResult.success) {
    return { success: false, error: "Invalid training goal" };
  }

  try {
    await db
      .update(profiles)
      .set({ experienceLevel: levelResult.data, trainingGoal: goalResult.data })
      .where(eq(profiles.id, profileId));

    revalidatePath("/profile");
    revalidatePath("/exercises");

    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function deleteProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
  await requireSiteSession();

  try {
    const activeProfileId = await getActiveProfileId();

    // Delete the profile (cascading deletes will handle related data)
    await db.delete(profiles).where(eq(profiles.id, profileId));

    // If this was the active profile, clear the cookie
    if (profileId === activeProfileId) {
      const cookieStore = await cookies();
      cookieStore.delete(ACTIVE_PROFILE_COOKIE);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete profile:", error);
    return { success: false, error: "Failed to delete profile" };
  }
}
