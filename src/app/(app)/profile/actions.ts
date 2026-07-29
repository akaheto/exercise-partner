"use server";

import { cookies } from "next/headers";
import { getAdminSessionStatus } from "@/app/admin/login/actions";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { ACTIVE_PROFILE_COOKIE, getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";
import { hashPin, verifyPin } from "@/lib/pin";

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

  const pinResult = pinSchema.safeParse(formData.get("pin"));
  if (!pinResult.success) {
    return { error: "PIN must be 4-6 digits." };
  }

  const [profile] = await db
    .insert(profiles)
    .values({ displayName: result.data, pinHash: hashPin(pinResult.data) })
    .returning();

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
const pinSchema = z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits");

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

/**
 * Confirms onboarding: persists the level/goal chosen in steps 2-3 (which,
 * before this, were only ever kept in the flow's local React state and never
 * written to the database — a second bug masked entirely by the first) and
 * stamps onboardingCompletedAt so /onboarding can tell "chose Beginner" from
 * "never asked" and stop redirecting an unfinished profile straight to
 * /exercises. Reads the active profile from the cookie set by createProfile
 * in step 1, rather than requiring the client to track and pass an id.
 */
export async function completeOnboarding(
  experienceLevel: string,
  trainingGoal: string,
): Promise<{ success: boolean; error?: string }> {
  await requireSiteSession();

  const profileId = await getActiveProfileId();
  if (!profileId) {
    return { success: false, error: "No active profile to complete onboarding for" };
  }

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
      .set({
        experienceLevel: levelResult.data,
        trainingGoal: goalResult.data,
        onboardingCompletedAt: new Date(),
      })
      .where(eq(profiles.id, profileId));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
    return { success: false, error: "Failed to save your profile" };
  }
}

export async function deleteProfile(
  profileId: string,
  pin: string,
): Promise<{ success: boolean; error?: string }> {
  await requireSiteSession();

  try {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    if (!profile.pinHash || !verifyPin(pin, profile.pinHash)) {
      return { success: false, error: "Incorrect PIN" };
    }

    const activeProfileId = await getActiveProfileId();
    await db.delete(profiles).where(eq(profiles.id, profileId));

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

/**
 * Admin-only deletion — bypasses the PIN check.
 *
 * This verifies the admin session itself rather than trusting the page that
 * rendered the button: a Server Action is reachable by direct request,
 * independent of which route tree it lives under, so the /admin page's own
 * guard protects the page and not this. It previously compared the cookie
 * against the literal string "authenticated", which meant anyone who could
 * reach the app could delete any profile and all of its history by setting
 * one cookie. Now checks a real signature — see src/lib/admin-auth.ts.
 */
export async function deleteProfileAsAdmin(profileId: string): Promise<{ success: boolean; error?: string }> {
  if (!(await getAdminSessionStatus())) {
    return { success: false, error: "Not authorized" };
  }

  const cookieStore = await cookies();

  try {
    const activeProfileId = await getActiveProfileId();
    await db.delete(profiles).where(eq(profiles.id, profileId));

    if (profileId === activeProfileId) {
      cookieStore.delete(ACTIVE_PROFILE_COOKIE);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete profile:", error);
    return { success: false, error: "Failed to delete profile" };
  }
}
