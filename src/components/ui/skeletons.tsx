import * as React from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading placeholders shaped like the thing that is loading.
 *
 * A generic spinner tells the user "wait"; a skeleton that matches the final
 * layout tells them what is coming and stops the page reflowing under their
 * thumb when it arrives. These are the shapes the app actually renders, so
 * screens stop hand-rolling one-off grey boxes with slightly different sizes.
 *
 * All of them carry aria-hidden and sit inside a container the caller marks
 * with `aria-busy` — a screen reader should hear "loading", not a description
 * of twelve grey rectangles.
 */

function SkeletonText({
  lines = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { lines?: number }) {
  return (
    <div
      data-slot="skeleton-text"
      aria-hidden="true"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4 w-full", index === lines - 1 && "w-3/5")}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-card"
      aria-hidden="true"
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <Skeleton className="h-5 w-1/2" />
      <SkeletonText lines={2} />
    </div>
  )
}

function SkeletonCardGrid({
  count = 6,
  className,
  ...props
}: React.ComponentProps<"div"> & { count?: number }) {
  return (
    <div
      data-slot="skeleton-card-grid"
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}

function SkeletonTable({
  rows = 8,
  columns = 5,
  className,
  ...props
}: React.ComponentProps<"div"> & { rows?: number; columns?: number }) {
  return (
    <div
      data-slot="skeleton-table"
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-xl border border-border",
        className
      )}
      {...props}
    >
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b border-border px-4 py-3 last:border-0"
        >
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton key={columnIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonStatRow({
  count = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { count?: number }) {
  return (
    <div
      data-slot="skeleton-stat-row"
      aria-hidden="true"
      className={cn("grid gap-4 sm:grid-cols-3", className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      ))}
    </div>
  )
}

function SkeletonPage({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-page"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading"
      className={cn("flex flex-col gap-6 px-4 py-8 md:px-6", className)}
      {...props}
    >
      <div aria-hidden="true" className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <SkeletonCardGrid />
    </div>
  )
}

export {
  SkeletonText,
  SkeletonCard,
  SkeletonCardGrid,
  SkeletonTable,
  SkeletonStatRow,
  SkeletonPage,
}
