import { createHash } from "node:crypto";

/**
 * Pure parsing helpers for turning the source spreadsheet's text conventions
 * into structured data. No I/O — kept testable without a database or a file.
 */

const EMPTY_MARKERS = new Set(["", "not listed", "none", "n/a"]);

function isEmptyMarker(value: string): boolean {
  return EMPTY_MARKERS.has(value.trim().toLowerCase());
}

/**
 * Parses the spreadsheet's Yes/No convention into a boolean. Missing or blank
 * values are treated as "No" (the spreadsheet's own convention for unpopulated
 * boolean fields), but any other value is a genuine data-quality problem and
 * throws rather than silently guessing.
 */
export function parseYesNo(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  if (text === "") return false;
  if (text.toLowerCase() === "yes") return true;
  if (text.toLowerCase() === "no") return false;
  throw new Error(`Unexpected Yes/No value: ${JSON.stringify(value)}`);
}

/**
 * Splits a comma-delimited muscle list ("Shoulders, Triceps") into trimmed,
 * non-empty names. Treats "None", "Not listed" and blank as no muscles at all.
 */
export function parseMuscleList(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  const text = String(value).trim();
  if (isEmptyMarker(text)) return [];
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !isEmptyMarker(part));
}

export interface ParsedLink {
  label: string;
  url: string | null;
}

/**
 * Parses the spreadsheet's "label | url; label2 | url2" convention used by
 * Variations, Alternative Exercises, Progression and Regression. A segment
 * without a "|" is kept as a label-only link rather than dropped, since the
 * source data is sparse enough that losing any of it silently would be worse
 * than surfacing an incomplete entry.
 */
export function parseRelatedLinks(value: unknown): ParsedLink[] {
  if (value === null || value === undefined) return [];
  const text = String(value).trim();
  if (isEmptyMarker(text)) return [];

  return text
    .split(";")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const separatorIndex = segment.indexOf("|");
      if (separatorIndex === -1) {
        return { label: segment, url: null };
      }
      const label = segment.slice(0, separatorIndex).trim();
      const url = segment.slice(separatorIndex + 1).trim();
      return { label: label || segment, url: url || null };
    });
}

/**
 * Stable content hash for a row, used by the import pipeline to detect real
 * changes on re-import without a column-by-column diff. Key order in `row`
 * does not affect the result.
 */
export function computeRowHash(row: Record<string, unknown>): string {
  const sortedKeys = Object.keys(row).sort();
  const normalised = sortedKeys.map((key) => {
    const value = row[key];
    // Dates serialise deterministically as ISO strings; everything else as-is.
    return [key, value instanceof Date ? value.toISOString() : value];
  });
  return createHash("sha256").update(JSON.stringify(normalised)).digest("hex");
}
