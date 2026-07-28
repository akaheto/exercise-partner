import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "focus-ring w-full min-w-0 rounded-lg border border-input bg-transparent transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 dark:disabled:bg-input/80",
  {
    variants: {
      // Mirrors Button. 44px is the VISUAL_STYLE_GUIDE.docx touch-target
      // minimum — shadcn's 32px default is too small for one-handed mobile
      // use. 36px is for dense table/toolbar rows only. 56px is Workout Mode,
      // where a number gets typed between sets.
      size: {
        compact: "h-9 px-2.5 text-small",
        default: "h-11 px-3 py-1 text-base",
        workout: "h-14 rounded-xl px-4 text-body-lg font-medium",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
