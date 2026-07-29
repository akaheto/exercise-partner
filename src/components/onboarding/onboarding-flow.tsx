"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/app/(app)/profile/actions";
import { OnboardingStep1Profile } from "./step-1-profile";
import { OnboardingStep2Level } from "./step-2-level";
import { OnboardingStep3Goal } from "./step-3-goal";
import { OnboardingStep4Complete } from "./step-4-complete";

type Step = 1 | 2 | 3 | 4;

/**
 * Navigation on completion lives here rather than in a prop. The page that
 * renders this is a Server Component, and a function prop crossing that
 * boundary throws "Event handlers cannot be passed to Client Component props"
 * — which it did, so /onboarding failed to render at all.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [profileName, setProfileName] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [goal, setGoal] = useState("General");
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const handleStep1Next = (name: string) => {
    setProfileName(name);
    setStep(2);
  };

  const handleStep2Next = (selectedLevel: string) => {
    setLevel(selectedLevel);
    setStep(3);
  };

  const handleStep3Next = (selectedGoal: string) => {
    setGoal(selectedGoal);
    setStep(4);
  };

  /**
   * Steps 2-3 only ever set local React state; nothing wrote level/goal to
   * the database until this call. This is also the moment onboarding_
   * completed_at is stamped, so /onboarding can stop redirecting a
   * still-in-progress profile straight to /exercises.
   */
  const handleComplete = async () => {
    setIsCompleting(true);
    setCompleteError(null);

    try {
      const result = await completeOnboarding(level, goal);
      if (!result.success) {
        setCompleteError(result.error ?? "Failed to save your profile");
        return;
      }
      router.push("/exercises");
    } catch {
      setCompleteError("Failed to save your profile");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Progress. The dots are decorative — the step count is announced as
            text so it isn't conveyed by colour and position alone. */}
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
            Step {step} of 4
          </p>
          <div className="flex items-center justify-between" aria-hidden="true">
            {([1, 2, 3, 4] as const).map((s) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-body font-semibold transition-colors",
                    s <= step
                      ? "bg-primary text-primary-foreground"
                      // The page ground is bg-muted, so an incomplete step
                      // filled with bg-muted vanished into it entirely.
                      : "border border-border bg-background text-muted-foreground",
                    s === step && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                >
                  {s < step ? <Check className="size-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      "mx-2 h-1 flex-1 rounded-full transition-colors",
                      s < step ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          {step === 1 && <OnboardingStep1Profile onNext={handleStep1Next} />}
          {step === 2 && (
            <OnboardingStep2Level
              profileName={profileName}
              onNext={handleStep2Next}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <OnboardingStep3Goal
              profileName={profileName}
              level={level}
              onNext={handleStep3Next}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <OnboardingStep4Complete
              profileName={profileName}
              level={level}
              goal={goal}
              onComplete={handleComplete}
              isSaving={isCompleting}
              error={completeError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
