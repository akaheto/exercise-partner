import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getActiveProfile } from "@/lib/active-profile";

export default async function OnboardingPage() {
  const profile = await getActiveProfile();

  // Redirect only once onboarding is actually finished. Checking for a
  // profile at all — the previous guard — redirected away the moment step 1
  // created one, before steps 2-4 ever ran: experience_level/training_goal
  // default to Beginner/General, so their mere presence can't tell "chose
  // Beginner" from "never asked". onboarding_completed_at can.
  if (profile?.onboardingCompletedAt) {
    redirect("/exercises");
  }

  // Step 1 creates the profile and makes it active; the flow persists
  // level/goal and navigates to /exercises itself once the last step is
  // confirmed. Revisiting /onboarding before that point restarts the flow at
  // step 1 rather than resuming — a known limitation, see PROJECT_PLAN.docx
  // section 4, item 47.
  return <OnboardingFlow />;
}
