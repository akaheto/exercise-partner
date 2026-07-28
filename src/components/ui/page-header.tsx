import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The single title treatment for a screen.
 *
 * D2 encodes two levels and this component is where the choice is made:
 *   level="page"   → text-h1 (24px). An in-app screen inside the shell:
 *                    Exercises, History, Profile, a workout detail.
 *   level="moment" → text-display (30px). A full-screen moment that owns the
 *                    whole viewport with no surrounding chrome: onboarding,
 *                    the session summary, login.
 *
 * Everything else on the header — description, actions, back link — hangs off
 * this so the vertical rhythm is identical on every screen.
 */
function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  level = "page",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"header">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  /** Right-aligned actions; wraps below the title on narrow viewports. */
  actions?: React.ReactNode
  /** Small label above the title — a breadcrumb-ish parent or category. */
  eyebrow?: React.ReactNode
  level?: "page" | "moment"
}) {
  return (
    <header
      data-slot="page-header"
      data-level={level}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? (
            <p
              data-slot="page-header-eyebrow"
              className="text-caption text-muted-foreground"
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            data-slot="page-header-title"
            className={cn(
              "font-heading text-balance text-foreground",
              level === "moment" ? "text-display" : "text-h1"
            )}
          >
            {title}
          </h1>
        </div>
        {actions ? (
          <div
            data-slot="page-header-actions"
            className="flex shrink-0 items-center gap-2"
          >
            {actions}
          </div>
        ) : null}
      </div>
      {description ? (
        <p
          data-slot="page-header-description"
          className="max-w-prose text-body text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {children}
    </header>
  )
}

export { PageHeader }
