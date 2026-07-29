/**
 * The design tokens, handed to recharts.
 *
 * recharts owns the markup for every chart part, so nothing here can be styled
 * by putting a class on an element we author. Two different mechanisms are
 * needed, and mixing them up is the classic dark-mode regression:
 *
 *  1. SVG parts — grid, axis lines, ticks, bars, lines, dots, the tooltip
 *     cursor — are styled with Tailwind CLASSES (`fill-*`, `stroke-*`), not
 *     with inline `{ fill: "var(--token)" }`. recharts passes those style
 *     objects through as SVG *presentation attributes*, where a `var()`
 *     reference is not reliably resolved; when it fails it fails silently and
 *     the element falls back to recharts' hard-coded light-mode default
 *     (#666 ticks, #ccc cursor). A class sets a real CSS declaration, which
 *     also outranks any presentation attribute recharts sets itself.
 *
 *  2. The tooltip body is plain HTML in a positioned <div>, and recharts only
 *     exposes it through inline style objects. `var()` is fine there, and is
 *     the only way in.
 *
 * Series colour is `chart-1` rather than `primary`: the chart ramp is the token
 * that is specified to stay legible on a chart surface in both themes.
 */

/** Horizontal rules behind the plot. */
export const chartGridProps = {
  strokeDasharray: "3 3",
  className: "stroke-border",
  vertical: false,
} as const;

/** Axis tick labels — text-caption (12px) in muted-foreground, both themes. */
export const chartTickProps = {
  className: "fill-muted-foreground text-caption",
} as const;

/** The axis rule itself, where an axis shows one. */
export const chartAxisLineProps = { className: "stroke-border" } as const;

export const chartSeriesFillClassName = "fill-chart-1";
export const chartSeriesStrokeClassName = "stroke-chart-1";

/**
 * The hover highlight. `foreground/10` reads as a subtle wash in both themes,
 * where `muted` would be invisible in dark (--muted and --card are the same
 * value there).
 */
export const chartBarCursorProps = { className: "fill-foreground/10" } as const;
export const chartLineCursorProps = { className: "stroke-border" } as const;

/** Tooltip: HTML, so `var()` works. Elevation is the overlay level. */
export const chartTooltipProps = {
  contentStyle: {
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--elevation-overlay)",
    fontSize: "var(--text-small)",
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--popover-foreground)" },
  wrapperStyle: { outline: "none" },
} as const;
