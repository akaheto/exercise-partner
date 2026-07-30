"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfileByName } from "@/db/queries/profiles";
import { verifyPin } from "@/lib/pin";

export interface ProfileVerificationState {
  error?: string;
}

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function verifyProfile(
  _prevState: ProfileVerificationState,
  formData: FormData,
): Promise<ProfileVerificationState> {
  const profileName = String(formData.get("profileName") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!profileName || !pin) {
    return { error: "Profile name and PIN are required." };
  }

  const profile = await getProfileByName(profileName);

  if (!profile) {
    return { error: "Profile or PIN incorrect." };
  }

  if (!profile.pinHash || !profile.pinSalt) {
    return { error: "Profile does not have a PIN set." };
  }

  if (!verifyPin(pin, profile.pinSalt, profile.pinHash)) {
    return { error: "Profile or PIN incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set("activeProfileId", profile.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR_IN_SECONDS,
    path: "/",
  });

  redirect("/exercises");
}
