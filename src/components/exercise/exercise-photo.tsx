"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The photorealistic start/end-position exercise photo (ENHANCEMENTS.docx's
 * "Photorealistic exercise images" idea, previously deferred to the end of
 * the project). Distinct from MuscleDiagramPhoto, which shows which muscles
 * a movement works, not how to perform it — this fills that gap.
 *
 * Unlike MuscleDiagramPhoto (deliberately a plain <img> because its host
 * varies per environment/store) and the hotlinked exercise thumbnails
 * (deliberately unoptimized because their third-party host 403s Vercel's
 * server-side fetch — PROJECT_PLAN.docx item 61), this lives on a fixed
 * Vercel Blob host this app controls, so next/image's normal server-side
 * resize/optimize path is safe to use here.
 *
 * Coverage is 1,218 of 1,271 exercises — the 53 exercises added later from
 * Workout Library imports (no source URL to have generated a photo from)
 * have none. Rather than track that as data, this renders nothing on a
 * missing/failed image rather than an error state: unlike the muscle
 * diagrams (which became the page's only muscle-visual once coverage was
 * confirmed complete), this is a supplemental visual, not one anything else
 * depends on being present.
 */

function baseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL;
  return url ? url.replace(/\/$/, "") : null;
}

export function ExercisePhoto({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const [failed, setFailed] = useState(false);
  const base = baseUrl();

  if (!base || failed) return null;

  const src = `${base}/exercise-photos/${exerciseId}.webp`;

  return (
    <Card>
      <CardContent>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={src}
            alt={`${exerciseName}: start and end position`}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
