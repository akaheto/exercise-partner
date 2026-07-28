import * as React from "react"
import { OctagonAlertIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * "Something went wrong."
 *
 * Deliberately separate from <EmptyState>. An empty log is a normal Tuesday;
 * a failed query is not, and the two must not look alike.
 *
 * `detail` is for the technical string (an error id, a message). It renders
 * quieter than the title so it can be present without being the headline —
 * useful information without alarming the reader.
 */
function ErrorState({
  icon: Icon = OctagonAlertIcon,
  title = "Something went wrong",
  description,
  detail,
  action,
  size = "default",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: LucideIcon
  title?: React.ReactNode
  description?: React.ReactNode
  /** Technical detail — an error id or raw message. */
  detail?: React.ReactNode
  /** Usually "Try again". */
  action?: React.ReactNode
  size?: "default" | "compact"
}) {
  return (
    <div
      data-slot="error-state"
      data-size={size}
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        size === "default" ? "min-h-[40vh] px-4 py-12" : "px-4 py-8",
        className
      )}
      {...props}
    >
      <Icon
        className={cn(
          "text-destructive-text",
          size === "default" ? "size-10" : "size-8"
        )}
        aria-hidden="true"
      />
      <h2
        data-slot="error-state-title"
        className={cn(
          "font-heading text-foreground",
          size === "default" ? "text-h2" : "text-h3"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          data-slot="error-state-description"
          className="max-w-sm text-body text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {detail ? (
        <p
          data-slot="error-state-detail"
          className="max-w-sm font-mono text-caption break-words text-muted-foreground"
        >
          {detail}
        </p>
      ) : null}
      {children}
      {action ? (
        <div data-slot="error-state-action" className="mt-1">
          {action}
        </div>
      ) : null}
    </div>
  )
}

export { ErrorState }
