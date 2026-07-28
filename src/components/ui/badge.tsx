import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * D4: badges are SENTENCE CASE. The uppercase caption treatment belongs to
 * field labels only — uppercasing badge content mangles exercise, equipment
 * and muscle names that come straight out of the spreadsheet.
 */
const badgeVariants = cva(
  "group/badge focus-ring inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap normal-case transition-colors has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        // Tinted status badges. Each pairs a -subtle surface with the matching
        // -text value; both measured >= 4.5:1 in light and dark.
        success:
          "border-success-border bg-success-subtle text-success-text [a]:hover:bg-success-subtle/80",
        warning:
          "border-warning-border bg-warning-subtle text-warning-text [a]:hover:bg-warning-subtle/80",
        destructive:
          "border-destructive-border bg-destructive-subtle text-destructive-text [a]:hover:bg-destructive-subtle/80",
        info: "border-info-border bg-info-subtle text-info-text [a]:hover:bg-info-subtle/80",
        muted: "bg-muted text-muted-foreground [a]:hover:bg-muted/80",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
