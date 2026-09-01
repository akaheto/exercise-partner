"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { generateWorkoutAction, type GenerateWorkoutState } from "@/app/(app)/build/generate/actions";
import {
  DURATION_OPTIONS,
  EXPERIENCE_LEVELS,
  FOCUS_AREAS,
  GOALS,
  type ExperienceLevel,
  type Focus,
  type Goal,
} from "@/domain/generator/types";

const GOAL_LABELS: Record<Goal, { title: string; description: string }> = {
  strength: { title: "General strength", description: "Heavier loads, lower reps, longer rest" },
  hypertrophy: { title: "Muscle gain", description: "Moderate loads and reps, moderate rest" },
  endurance: { title: "Muscular endurance", description: "Lighter loads, higher reps, short rest" },
  general: { title: "General fitness", description: "A balanced, moderate approach" },
};

const FOCUS_LABELS: Record<Focus, string> = {
  full_body: "Full body",
  upper_body: "Upper body",
  lower_body: "Lower body",
  push: "Push",
  pull: "Pull",
  core: "Core",
};

interface EquipmentOption {
  equipmentId: string;
  name: string;
}

const STEPS = ["Goal", "Duration", "Focus", "Experience", "Equipment"] as const;

function OptionCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        // min-h-11 keeps every option at the 44px touch minimum; the option
        // cards are the only control on most steps of the wizard.
        "focus-ring flex min-h-11 w-full flex-col justify-center rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted",
      )}
    >
      <p className="text-body font-medium">{title}</p>
      {description && <p className="text-small text-muted-foreground">{description}</p>}
    </button>
  );
}

const initialState: GenerateWorkoutState = {};

export function GeneratorWizard({
  equipmentOptions,
  initialHaveIds,
  initialExperienceLevel,
  initialGoal,
}: {
  equipmentOptions: EquipmentOption[];
  initialHaveIds: string[];
  initialExperienceLevel: ExperienceLevel;
  initialGoal: Goal;
}) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>(initialGoal);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [focus, setFocus] = useState<Focus>("full_body");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(initialExperienceLevel);
  const [haveIds, setHaveIds] = useState<Set<string>>(new Set(initialHaveIds));
  const [state, formAction, isPending] = useActionState(generateWorkoutAction, initialState);

  function toggleEquipment(id: string) {
    setHaveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div>
      <PageHeader
        title="Generate a workout"
        description={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
        className="mb-6"
      >
        <div
          className="flex gap-1"
          role="progressbar"
          aria-label="Wizard progress"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
        >
          {STEPS.map((s, i) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </PageHeader>

      {step === 0 && (
        <div className="space-y-2">
          {GOALS.map((g) => (
            <OptionCard
              key={g}
              selected={goal === g}
              onClick={() => setGoal(g)}
              title={GOAL_LABELS[g].title}
              description={GOAL_LABELS[g].description}
            />
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-3 gap-2">
          {DURATION_OPTIONS.map((minutes) => (
            <OptionCard key={minutes} selected={durationMinutes === minutes} onClick={() => setDurationMinutes(minutes)} title={`${minutes} min`} />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_AREAS.map((f) => (
            <OptionCard key={f} selected={focus === f} onClick={() => setFocus(f)} title={FOCUS_LABELS[f]} />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <OptionCard key={level} selected={experienceLevel === level} onClick={() => setExperienceLevel(level)} title={level} />
          ))}
        </div>
      )}

      {step === 4 && (
        <div>
          <p className="mb-3 text-body text-muted-foreground">
            What do you have access to? This is saved to your profile.
          </p>
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto">
            {equipmentOptions.map((eq) => (
              <OptionCard key={eq.equipmentId} selected={haveIds.has(eq.equipmentId)} onClick={() => toggleEquipment(eq.equipmentId)} title={eq.name} />
            ))}
          </div>
          {haveIds.size === 0 && (
            <Callout tone="warning" className="mt-3">
              Nothing selected yet — with no equipment marked, most exercises won&apos;t match. Select
              what you actually have access to, even just your bodyweight.
            </Callout>
          )}
        </div>
      )}

      {state.error && (
        <Callout tone="danger" className="mt-4">
          {state.error}
        </Callout>
      )}
      {state.warnings?.map((w, i) => (
        <Callout key={i} tone="warning" className="mt-2">
          {w}
        </Callout>
      ))}

      <div className="mt-6 flex items-center justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="gap-2">
          <ArrowLeft className="size-4" /> Back
        </Button>

        {isLastStep ? (
          <form action={formAction}>
            <input type="hidden" name="goal" value={goal} />
            <input type="hidden" name="durationMinutes" value={durationMinutes} />
            <input type="hidden" name="focus" value={focus} />
            <input type="hidden" name="experienceLevel" value={experienceLevel} />
            {equipmentOptions.map((eq) => (
              <input key={eq.equipmentId} type="hidden" name="allEquipmentId" value={eq.equipmentId} />
            ))}
            {[...haveIds].map((id) => (
              <input key={id} type="hidden" name="equipmentId" value={id} />
            ))}
            {equipmentOptions.filter((eq) => haveIds.has(eq.equipmentId)).map((eq) => (
              <input key={eq.equipmentId} type="hidden" name="equipmentName" value={eq.name} />
            ))}
            <Button type="submit" loading={isPending} loadingLabel="Generating your workout" className="gap-2">
              <Wand2 className="size-4" /> Generate workout
            </Button>
          </form>
        ) : (
          <Button type="button" onClick={() => setStep((s) => s + 1)} className="gap-2">
            Next <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
