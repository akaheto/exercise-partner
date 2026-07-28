import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * "There is nothing here, and that is fine."
 *
 * Distinct from <ErrorState>, which means "something went wrong". Conflating
 * the two is how a first-run screen ends up looking like a failure.
 *
 * VISUAL_STYLE_GUIDE.docx: empty states are designed, not accidental — icon,
 * a plain-language title, one sentence of why, and the action that fills it.
 * Copy stays direct: no hype, no shame about an empty log.
 *
 * D7: the icon renders in muted-foreground so lucide icons drop straight in
 * where onboarding currently uses emoji.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "default",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  /** The one thing to do next. Optional — some empties have no action. */
  action?: React.ReactNode
  /** `compact` for inside a card or panel; `default` for a whole screen. */
  size?: "default" | "compact"
}) {
  return (
    <div
      data-slot="empty-state"
      data-size={size}
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        size === "default" ? "min-h-[40vh] px-4 py-12" : "px-4 py-8",
        className
      )}
      {...props}
    >
      {Icon ? (
        <Icon
          className={cn(
            "text-muted-foreground",
            size === "default" ? "size-10" : "size-8"
          )}
          aria-hidden="true"
        />
      ) : null}
      <h2
        data-slot="empty-state-title"
        className={cn(
          "font-heading text-foreground",
          size === "default" ? "text-h2" : "text-h3"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          data-slot="empty-state-description"
          className="max-w-sm text-body text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {children}
      {action ? (
        <div data-slot="empty-state-action" className="mt-1">
          {action}
        </div>
      ) : null}
    </div>
  )
}

export { EmptyState }
