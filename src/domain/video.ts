/**
 * Pure classification of the spreadsheet's video URLs (Epic D5). Confirmed
 * shapes in the source data: youtube.com/embed/... (775 rows, safely embeddable)
 * and player.vimeo.com/video/... (443 rows, often have privacy restrictions
 * that block embedding).
 *
 * Vimeo videos are excluded from direct embedding because ~443 have privacy
 * settings that prevent iframe embedding ("this video cannot be played here").
 * These fall back to "Watch on source page" links instead.
 */
export function isEmbeddableVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    // Only embed YouTube videos; Vimeo has privacy restrictions that block embedding
    return hostname === "www.youtube.com" || hostname === "youtube.com";
  } catch {
    return false;
  }
}
