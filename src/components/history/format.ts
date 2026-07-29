/**
 * Display formatting for logged numbers. Presentation only — nothing here
 * changes what is stored or aggregated.
 *
 * `weight` is a numeric(7,2) column, so the driver hands back "50.00" and
 * "52.50". Those trailing zeros are noise at any size and actively bad at
 * text-metric, where the number is the headline.
 */
export function formatWeight(weight: string | number | null): string | null {
  if (weight === null || weight === "") return null;
  const value = typeof weight === "string" ? Number(weight) : weight;
  // A non-numeric string is data we don't understand; show it rather than
  // silently rendering "NaN".
  if (!Number.isFinite(value)) return String(weight);
  return String(value);
}
