"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Weight, reps and set counts, entered between sets.
 *
 * Two things this exists for:
 *  - `size="workout"` gives 56px targets, because typing on a phone keyboard
 *    with chalky hands halfway through a set is the actual use case;
 *  - `step` is a real domain input, not a UI detail. Weight steps by plate
 *    increments (2.5kg / 5lb), reps step by 1. The caller decides; the
 *    component never guesses.
 *
 * Clamping happens on commit, not on every keystroke, so typing "12" into a
 * field with min 5 doesn't get rewritten to "5" the moment "1" is typed.
 */
function NumberStepper({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  size = "default",
  disabled,
  label,
  id,
  className,
  inputClassName,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  value: number | null
  onValueChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  size?: "compact" | "default" | "workout"
  disabled?: boolean
  /** Accessible name when there is no visible <Field> label alongside. */
  label?: string
  id?: string
  inputClassName?: string
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const text = draft ?? (value === null ? "" : String(value))

  function clamp(next: number): number {
    let out = next
    if (min !== undefined) out = Math.max(min, out)
    if (max !== undefined) out = Math.min(max, out)
    // Kill float dust from 0.1-style steps: 2.5 + 2.5 + 2.5 = 7.500000000001.
    return Math.round(out * 1e6) / 1e6
  }

  function nudge(direction: 1 | -1) {
    const base = value ?? min ?? 0
    onValueChange(clamp(base + direction * step))
    setDraft(null)
  }

  function commit(raw: string) {
    setDraft(null)
    const trimmed = raw.trim()
    if (trimmed === "") {
      onValueChange(null)
      return
    }
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
      // Garbage in — keep the last good value rather than writing NaN.
      return
    }
    onValueChange(clamp(parsed))
  }

  const buttonSize = size === "workout" ? "icon-workout" : size === "compact" ? "icon-sm" : "icon"
  const atMin = value !== null && min !== undefined && value <= min
  const atMax = value !== null && max !== undefined && value >= max

  return (
    <div
      data-slot="number-stepper"
      data-size={size}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        disabled={disabled || atMin}
        onClick={() => nudge(-1)}
        aria-label={label ? `Decrease ${label}` : "Decrease"}
      >
        <MinusIcon aria-hidden="true" />
      </Button>

      <Input
        id={id}
        type="text"
        inputMode="decimal"
        size={size}
        disabled={disabled}
        aria-label={label}
        value={text}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commit((event.target as HTMLInputElement).value)
          }
          if (event.key === "ArrowUp") {
            event.preventDefault()
            nudge(1)
          }
          if (event.key === "ArrowDown") {
            event.preventDefault()
            nudge(-1)
          }
        }}
        className={cn(
          "w-20 text-center font-mono tabular-nums",
          size === "workout" && "w-28",
          inputClassName
        )}
      />

      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        disabled={disabled || atMax}
        onClick={() => nudge(1)}
        aria-label={label ? `Increase ${label}` : "Increase"}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
    </div>
  )
}

export { NumberStepper }
