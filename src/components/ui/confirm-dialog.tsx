"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * "Are you sure?" with the parts that are always got wrong done once:
 *
 *  - the confirm button disables and spins while the action is in flight, so
 *    a slow server action can't be double-fired;
 *  - a rejected/failed action keeps the dialog OPEN and surfaces the reason
 *    inside it, instead of closing optimistically and losing the error;
 *  - D3: the confirm button is SOLID destructive when tone="danger". The
 *    trigger the caller passes in is the quiet one.
 *
 * `onConfirm` may return void, a promise, or `{ error }` to fail in place.
 */

type ConfirmResult = void | { error?: string | null }

type ConfirmDialogProps = {
  /** The element that opens the dialog — usually a quiet destructive Button. */
  trigger?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: "danger" | "default"
  /** Extra content between the description and the buttons (e.g. a PIN field). */
  children?: React.ReactNode
  onConfirm: () => ConfirmResult | Promise<ConfirmResult>
  /** Controlled open state. Omit for uncontrolled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  children,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
  className,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
      // A dismissed dialog must not remember the last failure.
      if (!next) setError(null)
    },
    [isControlled, onOpenChange]
  )

  async function handleConfirm() {
    setPending(true)
    setError(null)
    try {
      const result = await onConfirm()
      if (result && typeof result === "object" && result.error) {
        setError(result.error)
        return
      }
      setOpen(false)
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "That didn't work. Try again."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Ignore dismissals while the action is in flight; the user would
        // otherwise lose the outcome of something already happening.
        if (pending) return
        setOpen(next)
      }}
    >
      {React.isValidElement(trigger) ? (
        <DialogTrigger
          render={trigger as React.ReactElement<Record<string, unknown>>}
        />
      ) : trigger ? (
        <DialogTrigger>{trigger}</DialogTrigger>
      ) : null}
      <DialogContent
        data-slot="confirm-dialog"
        showCloseButton={false}
        className={cn(className)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {children}

        {error ? (
          <Callout tone="danger" className="text-small">
            {error}
          </Callout>
        ) : null}

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={pending} />}
          >
            {cancelLabel}
          </DialogClose>
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            loading={pending}
            loadingLabel={`${confirmLabel} in progress`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
