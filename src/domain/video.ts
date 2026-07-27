/**
 * Pure classification of the spreadsheet's video URLs (Epic D5). Confirmed
 * shapes in the source data: youtube.com/embed/... (775 rows) and
 * player.vimeo.com/video/... (443 rows) — see TECHNICAL_SPEC.docx "Media".
 * Anything else falls back to a source link rather than a broken embed.
 */
export function isEmbeddableVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === "www.youtube.com" || hostname === "youtube.com" || hostname === "player.vimeo.com";
  } catch {
    return false;
  }
}
