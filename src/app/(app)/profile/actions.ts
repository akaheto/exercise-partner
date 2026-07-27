"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/active-profile";
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
