import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button focus-ring inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        // D3 — SOLID red. This is the confirm button inside a destructive
        // dialog: the last click before data is gone, so it carries full
        // weight. Never use it as a row-level trigger.
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),black_12%)] active:bg-[color-mix(in_oklch,var(--destructive),black_20%)]",
        // D3 — QUIET/tinted red. This is the trigger in a dense row or
        // toolbar. It opens the dialog; it does not do the deleting, so it
        // shouldn't shout at the user for merely existing.
        "destructive-quiet":
          "bg-destructive-subtle text-destructive-text hover:bg-[color-mix(in_oklch,var(--destructive-subtle),var(--destructive)_18%)]",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      // Heights follow VISUAL_STYLE_GUIDE.docx section 4: 44px (`default`) is
      // the accessible minimum for anything interactive; 36px (`sm`) is
      // reserved for dense contexts — table rows and toolbars — and is never
      // a page's primary action; 56px (`workout`) is Workout Mode's primary
      // action size, sized to be hit reliably mid-set.
      size: {
        default:
          "h-11 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-md px-2.5 text-small in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-14 gap-2 px-5 text-body has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        workout:
          "h-14 min-w-14 gap-2 rounded-xl px-6 text-body font-semibold has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11",
        "icon-xs":
          "size-7 rounded-md in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-md in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-14",
        "icon-workout":
          "size-14 rounded-xl [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /**
     * Swaps the label for a spinner and disables the button. Server actions
     * are the common case: without this every call site re-invents a
     * `pending` boolean and half of them forget to disable, so the form
     * double-submits.
     */
    loading?: boolean
    /** Announced to assistive tech while `loading` is true. */
    loadingLabel?: string
  }

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  loadingLabel = "Working",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <>
          <Loader2Icon className="animate-spin" aria-hidden="true" />
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
