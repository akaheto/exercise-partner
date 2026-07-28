import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  OctagonAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * An inline block of consequential text: a caveat, a confirmation, a warning,
 * a failure.
 *
 * This is the single component that the four-role colour model exists for.
 * Before it, every one of these was hand-built as
 * `bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800
 * text-amber-800 dark:text-amber-200` — four palette literals per callout,
 * per component, each one an independent chance to get dark mode wrong.
 *
 * `danger` (not `destructive`) is the tone name here: a callout describes a
 * problem, it doesn't destroy anything. The destructive Button variants are
 * the ones that do.
 */
const calloutVariants = cva(
  "flex gap-3 rounded-xl border p-4 text-body [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2",
  {
    variants: {
      tone: {
        info: "border-info-border bg-info-subtle text-info-text",
        success: "border-success-border bg-success-subtle text-success-text",
        warning: "border-warning-border bg-warning-subtle text-warning-text",
        danger:
          "border-destructive-border bg-destructive-subtle text-destructive-text",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  }
)

const TONE_ICON = {
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  danger: OctagonAlertIcon,
} as const

/** `danger` announces immediately; the rest are polite. */
const TONE_ROLE = {
  info: undefined,
  success: undefined,
  warning: undefined,
  danger: "alert",
} as const

type CalloutProps = React.ComponentProps<"div"> &
  VariantProps<typeof calloutVariants> & {
    title?: React.ReactNode
    /** Pass `false` to drop the leading icon. */
    icon?: React.ReactNode | false
  }

function Callout({
  tone = "info",
  title,
  icon,
  className,
  children,
  ...props
}: CalloutProps) {
  const resolvedTone = tone ?? "info"
  const Icon = TONE_ICON[resolvedTone]

  return (
    <div
      data-slot="callout"
      data-tone={resolvedTone}
      role={TONE_ROLE[resolvedTone]}
      className={cn(calloutVariants({ tone }), className)}
      {...props}
    >
      {icon === false ? null : (
        <span
          data-slot="callout-icon"
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        >
          {icon ?? <Icon className="size-5" />}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        {title ? (
          <p data-slot="callout-title" className="font-semibold">
            {title}
          </p>
        ) : null}
        {children ? (
          <div data-slot="callout-body" className="[&_p+p]:mt-2">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { Callout, calloutVariants }
export type { CalloutProps }
