import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getActiveProfileId } from "@/lib/active-profile";

export default async function OnboardingPage() {
  const profileId = await getActiveProfileId();

  // If user already has a profile, redirect to exercises
  if (profileId) {
    redirect("/exercises");
  }

  // Step 1 creates the profile and makes it active; the flow navigates to
  // /exercises itself once the last step is confirmed.
  return <OnboardingFlow />;
}
