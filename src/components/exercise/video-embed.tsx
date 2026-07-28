import { ExternalLink } from "lucide-react";
import { isEmbeddableVideoUrl } from "@/domain/video";

export function VideoEmbed({ videoUrl, sourceUrl }: { videoUrl: string | null; sourceUrl: string | null }) {
  if (videoUrl && isEmbeddableVideoUrl(videoUrl)) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
        <iframe
          src={videoUrl}
          title="Exercise demonstration video"
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted text-body font-medium text-foreground transition-colors hover:border-primary/50"
      >
        <ExternalLink className="size-6 text-muted-foreground" aria-hidden="true" />
        Watch on the source page
      </a>
    );
  }

  return null;
}
