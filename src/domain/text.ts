/**
 * The source spreadsheet's Instructions/Tips/Common Mistakes fields are
 * flowing prose ("Keep the movement controlled. Maintain trunk tension.").
 * The spec calls for bulleted instructions on the detail page, so this splits
 * prose into sentence-level bullets rather than requiring a second content
 * format. Preserves numbered steps (1. 2. 3.) as part of their sentences.
 * Pure and unit-tested — no I/O.
 */
export function splitIntoSentences(text: string | null | undefined): string[] {
  if (!text) return [];
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);

  // Rejoin parts that are just step numbers (like "1." "2." "3.")
  // with their following content to preserve numbered instructions
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    // Check if this part is just a digit followed by punctuation (e.g., "1." "2.")
    if (/^\d+[.!?]$/.test(part) && i + 1 < parts.length) {
      // Rejoin with the next part
      result.push(`${part} ${parts[i + 1].trim()}`);
      i++; // Skip the next iteration since we already processed it
    } else if (part.length > 0) {
      result.push(part);
    }
  }
  return result;
}
