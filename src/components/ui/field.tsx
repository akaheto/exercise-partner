"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A labelled form control with its description and error, wired together
 * automatically.
 *
 * The point of this primitive is that `id`, `aria-describedby`, `aria-invalid`
 * and the error's `role="alert"` are never hand-written at a call site. Every
 * hand-wired version of this in the app so far got at least one of them wrong,
 * and a validation message that isn't in `aria-describedby` is invisible to a
 * screen reader.
 *
 * D4: the label uses the uppercase caption treatment. That treatment is for
 * field labels ONLY — badges stay sentence case.
 */

type FieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** Steady-state helper text. Always announced, error or not. */
  description?: React.ReactNode
  /** When set, the field renders as invalid and announces this message. */
  error?: React.ReactNode
  /** Marks the control required and shows the affordance next to the label. */
  required?: boolean
  /**
   * Visually hides the label but keeps it for assistive tech. Use only when
   * an adjacent visual affordance already names the control.
   */
  labelHidden?: boolean
  /** The control. A single element, e.g. <Input /> or <select />. */
  children: React.ReactNode
}

function Field({
  label,
  description,
  error,
  required,
  labelHidden,
  className,
  children,
  ...props
}: FieldProps) {
  const reactId = React.useId()

  const child = React.isValidElement(children) ? children : null
  const childProps = (child?.props ?? {}) as Record<string, unknown>

  // Respect an id the caller already put on the control; otherwise generate.
  const controlId =
    typeof childProps.id === "string" && childProps.id
      ? childProps.id
      : `field-${reactId}`

  const descriptionId = description ? `${controlId}-description` : undefined
  const errorId = error ? `${controlId}-error` : undefined

  const describedBy =
    [
      typeof childProps["aria-describedby"] === "string"
        ? (childProps["aria-describedby"] as string)
        : undefined,
      descriptionId,
      errorId,
    ]
      .filter(Boolean)
      .join(" ") || undefined

  const control = child
    ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : childProps["aria-invalid"],
        "aria-required": required ? true : childProps["aria-required"],
        required: required ? true : childProps.required,
      })
    : children

  return (
    <div
      data-slot="field"
      data-invalid={error ? "" : undefined}
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      <label
        data-slot="field-label"
        // Only point at a control we actually managed to wire.
        htmlFor={child ? controlId : undefined}
        className={cn(
          "text-caption font-semibold tracking-wide text-muted-foreground uppercase select-none",
          labelHidden && "sr-only"
        )}
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive-text" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {control}

      {description ? (
        <p
          id={descriptionId}
          data-slot="field-description"
          className="text-small text-muted-foreground"
        >
          {description}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          data-slot="field-error"
          role="alert"
          className="text-small font-medium text-destructive-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { Field }
export type { FieldProps }
