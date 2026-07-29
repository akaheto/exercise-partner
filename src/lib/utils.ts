import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The named type scale from globals.css (`text-timer`, `text-metric`,
 * `text-caption`, …) has to be declared to tailwind-merge.
 *
 * tailwind-merge only recognises t-shirt sizes (`text-sm`, `text-2xl`) as
 * font sizes. Anything else matching `text-*` falls through to its
 * `text-color` group, so `cn("text-caption text-muted-foreground")` saw two
 * "colours", kept the last, and silently DROPPED `text-caption`. Every
 * primitive that combines a scale class with a colour through `cn` was
 * losing one of the two — Field's uppercase labels rendered at the inherited
 * size, and `cn(buttonVariants({ size: "lg" }), …)` lost
 * `text-primary-foreground` because `text-body` displaced it, leaving a teal
 * button with unstyled label text.
 *
 * Registering the scale under `font-size` makes it conflict with raw sizes
 * (so `cn("text-3xl", "text-display")` resolves to `text-display`) and stop
 * conflicting with colours.
 */
const TYPE_SCALE = [
  "display",
  "h1",
  "h2",
  "h3",
  "body-lg",
  "body",
  "small",
  "caption",
  "metric",
  "timer",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TYPE_SCALE }],
    },
  },
});

/**
 * Merge conditional class names, resolving conflicting Tailwind utilities so
 * the last one wins (e.g. `cn("p-2", "p-4")` -> `"p-4"`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
