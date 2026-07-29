"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A large, tappable choice: icon, label, and a line explaining what picking it
 * means. Used where a decision deserves more room than a chip — the onboarding
 * steps, and anywhere else a question is the whole screen.
 *
 * Two things it fixes over the hand-rolled versions it replaces. The icon is
 * decorative (it repeats the label, and an emoji read aloud is noise), so it is
 * aria-hidden rather than left for a screen reader to announce. And `selected`
 * drives `aria-pressed`, so a chosen option is not communicated by colour
 * alone — VISUAL_STYLE_GUIDE.docx section 1.
 */
function OptionCard({
  icon,
  label,
  description,
  selected,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  icon?: React.ReactNode
  label: React.ReactNode
  description?: React.ReactNode
  /** Omit entirely for options that act immediately rather than toggle. */
  selected?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="option-card"
      aria-pressed={selected}
      className={cn(
        "focus-ring flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left transition-colors",
        "hover:border-primary-border hover:bg-primary-subtle",
        selected
          ? "border-primary-border bg-primary-subtle"
          : "border-border",
        className
      )}
      {...props}
    >
      {icon ? (
        <span
          data-slot="option-card-icon"
          className="shrink-0 text-h1 leading-none"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col gap-1">
        <span data-slot="option-card-label" className="text-body font-semibold text-foreground">
          {label}
        </span>
        {description ? (
          <span
            data-slot="option-card-description"
            className="text-small text-muted-foreground"
          >
            {description}
          </span>
        ) : null}
      </span>
    </button>
  )
}

export { OptionCard }
