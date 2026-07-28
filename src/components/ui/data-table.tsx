import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Table primitives with the scroll container, borders and cell rhythm already
 * decided, so a table can't drift from the rest of the product one `px-4` at a
 * time.
 *
 * D5: cells are text-small (14px) — table cells are metadata, scanned rather
 * than read. Prose does not belong in a table cell.
 *
 * The horizontal scroll lives on <DataTable> rather than the page, so a wide
 * table on a 375px phone scrolls itself instead of making the whole screen
 * slide sideways.
 */
function DataTable({
  className,
  containerClassName,
  minWidth = 720,
  ...props
}: React.ComponentProps<"table"> & {
  containerClassName?: string
  /** Below this width the table scrolls rather than crushing columns. */
  minWidth?: number
}) {
  return (
    <div
      data-slot="data-table-container"
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border",
        containerClassName
      )}
    >
      <table
        data-slot="data-table"
        style={{ minWidth: `${minWidth}px` }}
        className={cn("w-full text-left text-small", className)}
        {...props}
      />
    </div>
  )
}

function DataTableHead({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="data-table-head"
      className={cn("bg-muted/50", className)}
      {...props}
    />
  )
}

function DataTableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="data-table-body" className={className} {...props} />
}

function DataTableRow({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"tr"> & {
  /** Adds a hover affordance. Only set it when the row actually does something. */
  interactive?: boolean
}) {
  return (
    <tr
      data-slot="data-table-row"
      className={cn(
        "border-b border-border last:border-0",
        interactive && "hover:bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * D4 does NOT apply here: column headers stay sentence case. The uppercase
 * caption treatment is for form field labels only.
 */
function DataTableHeader({
  className,
  align = "start",
  ...props
}: Omit<React.ComponentProps<"th">, "align"> & {
  align?: "start" | "center" | "end"
}) {
  return (
    <th
      data-slot="data-table-header"
      scope="col"
      className={cn(
        "border-b border-border px-4 py-3 text-caption font-semibold text-muted-foreground",
        align === "center" && "text-center",
        align === "end" && "text-right",
        className
      )}
      {...props}
    />
  )
}

function DataTableCell({
  className,
  align = "start",
  numeric = false,
  ...props
}: Omit<React.ComponentProps<"td">, "align"> & {
  align?: "start" | "center" | "end"
  /** Mono + tabular so columns of numbers line up and don't jitter. */
  numeric?: boolean
}) {
  return (
    <td
      data-slot="data-table-cell"
      className={cn(
        "px-4 py-3 text-muted-foreground",
        numeric && "font-mono tabular-nums text-foreground",
        align === "center" && "text-center",
        align === "end" && "text-right",
        className
      )}
      {...props}
    />
  )
}

function DataTableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="data-table-caption"
      className={cn(
        "caption-bottom px-4 py-3 text-small text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeader,
  DataTableCell,
  DataTableCaption,
}
