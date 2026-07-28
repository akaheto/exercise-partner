import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * One number with its label — volume, PR, streak, session count.
 *
 * The value uses text-metric, which is Geist Mono with tabular numerals, so a
 * row of stats stays optically aligned and a live-updating number doesn't
 * shuffle its own digits sideways.
 *
 * CLAUDE.md rule 4: much of this app's data is derived rather than sourced.
 * `caveat` exists so a stat can carry "estimated" inline instead of being
 * presented as measured fact.
 */
const trendVariants = cva("text-small font-medium", {
  variants: {
    // "up" is not automatically good — more volume is progress, more missed
    // sessions is not. The caller states the meaning; this only states the
    // direction's tone.
    trend: {
      positive: "text-success-text",
      negative: "text-destructive-text",
      neutral: "text-muted-foreground",
    },
  },
  defaultVariants: { trend: "neutral" },
})

function Stat({
  label,
  value,
  unit,
  delta,
  trend = "neutral",
  caveat,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof trendVariants> & {
    label: React.ReactNode
    value: React.ReactNode
    /** kg, lb, sets, reps — rendered smaller and next to the value. */
    unit?: React.ReactNode
    /** e.g. "+12%" or "−3 sets". */
    delta?: React.ReactNode
    /** e.g. "Estimated" — see CLAUDE.md rule 4. */
    caveat?: React.ReactNode
  }) {
  return (
    <div
      data-slot="stat"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <p
        data-slot="stat-label"
        className="text-caption font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </p>
      <p className="flex flex-wrap items-baseline gap-1.5">
        <span data-slot="stat-value" className="text-metric text-foreground">
          {value}
        </span>
        {unit ? (
          <span
            data-slot="stat-unit"
            className="text-small text-muted-foreground"
          >
            {unit}
          </span>
        ) : null}
        {delta ? (
          <span data-slot="stat-delta" className={cn(trendVariants({ trend }))}>
            {delta}
          </span>
        ) : null}
      </p>
      {caveat ? (
        <p data-slot="stat-caveat" className="text-caption text-muted-foreground">
          {caveat}
        </p>
      ) : null}
      {children}
    </div>
  )
}

export { Stat }
