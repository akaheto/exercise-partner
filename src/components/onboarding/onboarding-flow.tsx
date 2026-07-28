"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { OnboardingStep1Profile } from "./step-1-profile";
import { OnboardingStep2Level } from "./step-2-level";
import { OnboardingStep3Goal } from "./step-3-goal";
import { OnboardingStep4Complete } from "./step-4-complete";

type Step = 1 | 2 | 3 | 4;

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [profileName, setProfileName] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [goal, setGoal] = useState("General");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-between">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex size-10 items-center justify-center rounded-full font-semibold transition-colors ${
                  s < step
                    ? "bg-teal-600 text-white"
                    : s === step
                      ? "bg-teal-600 text-white ring-2 ring-teal-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="size-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`mx-2 h-1 w-8 sm:w-12 transition-colors ${
                    s < step ? "bg-teal-600" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
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
              onComplete={onComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
