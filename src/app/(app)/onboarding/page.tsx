import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getActiveProfileId } from "@/lib/active-profile";

export default async function OnboardingPage() {
  const profileId = await getActiveProfileId();

  // If user already has a profile, redirect to exercises
  if (profileId) {
    redirect("/exercises");
  }

  // Show onboarding flow for new users
  // The flow will create a profile and set it as active
  return (
    <OnboardingFlow
      onComplete={() => {
        // This will be a client-side redirect after profile creation
        // The redirect happens in step 1 after profile is created
      }}
    />
  );
}
