/**
 * The source spreadsheet's Instructions/Tips/Common Mistakes fields are
 * flowing prose ("Keep the movement controlled. Maintain trunk tension.").
 * The spec calls for bulleted instructions on the detail page, so this splits
 * prose into sentence-level bullets rather than requiring a second content
 * format. Pure and unit-tested — no I/O.
 */
export function splitIntoSentences(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
