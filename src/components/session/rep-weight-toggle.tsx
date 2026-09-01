"use client";

import { Button } from "@/components/ui/button";

interface RepToggleProps {
  value: number | "Max" | null;
  onChange: (value: number | "Max" | null) => void;
  min: number | null;
  max: number | null;
  label: string;
}

export function RepToggle({ value, onChange, min, max, label }: RepToggleProps) {
  if (min === null || max === null) {
    return null;
  }

  const cycle: number[] = [];
  for (let i = min; i <= max; i++) {
    cycle.push(i);
  }

  const displayValue = value === null ? "—" : value;

  function handleClick() {
    if (value === null) {
      onChange(min);
    } else if (value === "Max") {
      onChange(min);
    } else {
      const idx = cycle.indexOf(value);
      if (idx !== -1 && idx < cycle.length - 1) {
        onChange(cycle[idx + 1]);
      } else if (idx === cycle.length - 1) {
        onChange("Max");
      } else {
        onChange(min);
      }
    }
  }

  return (
    <Button
      type="button"
      size="workout"
      variant="outline"
      onClick={handleClick}
      className="w-full font-mono text-metric"
      aria-label={`${label}: ${displayValue}. Tap to cycle through ${min}-${max} or Max.`}
    >
      {displayValue}
    </Button>
  );
}

interface WeightToggleProps {
  value: number | null;
  onChange: (value: number | null) => void;
  unit: "kg" | "lb";
  label: string;
}

export function WeightToggle({ value, onChange, unit, label }: WeightToggleProps) {
  const cycle = unit === "lb" ? [5, 10, 15, 20, 25, 30, 35, 40] : [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20];

  const displayValue = value === null ? "—" : `${value}${unit}`;

  function handleClick() {
    if (value === null) {
      onChange(cycle[0]);
    } else {
      const idx = cycle.indexOf(value);
      if (idx !== -1) {
        onChange(cycle[(idx + 1) % cycle.length]);
      } else {
        onChange(cycle[0]);
      }
    }
  }

  return (
    <Button
      type="button"
      size="workout"
      variant="outline"
      onClick={handleClick}
      // min-w-0 + flex-1 (not w-full): this sits beside the unit-toggle
      // button in a shared row (session-runner.tsx) and has to actually
      // shrink to make room for it — every Button defaults to shrink-0.
      className="min-w-0 flex-1 shrink font-mono text-metric"
      aria-label={`${label}: ${displayValue}. Tap to cycle weight.`}
    >
      {displayValue}
    </Button>
  );
}

interface SetToggleProps {
  value: number | null;
  onChange: (value: number | null) => void;
  guideValue: number | null;
  label: string;
}

export function SetToggle({ value, onChange, guideValue, label }: SetToggleProps) {
  if (guideValue === null) {
    return null;
  }

  const cycle = [guideValue, guideValue + 1, Math.max(1, guideValue - 1)];

  const displayValue = value === null ? "—" : value;

  function handleClick() {
    if (value === null) {
      onChange(guideValue);
    } else {
      const idx = cycle.indexOf(value);
      if (idx !== -1) {
        onChange(cycle[(idx + 1) % cycle.length]);
      } else {
        onChange(guideValue);
      }
    }
  }

  return (
    <Button
      type="button"
      size="workout"
      variant="outline"
      onClick={handleClick}
      className="w-full font-mono text-metric"
      aria-label={`${label}: ${displayValue}. Tap to cycle sets.`}
    >
      {label}: <span className="ml-1 font-semibold">{displayValue}</span>
    </Button>
  );
}
