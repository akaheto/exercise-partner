"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";

/**
 * The supplied anatomical render (Epic O) — a real photographic-style body
 * map. Originally shown alongside the app's own hand-built MuscleDiagram,
 * then replaced it on the exercise detail page once coverage was confirmed
 * complete (1,218/1,218). MuscleDiagram was kept a while longer in Workout
 * Mode (src/components/session/session-runner.tsx), on the theory that a
 * full photographic plate would compete for space a mid-set screen needs for
 * logging — but by explicit request, this now renders there too, for visual
 * consistency between the exercise detail page and Workout Mode.
 * MuscleDiagram itself has been deleted; nothing imports it anymore.
 *
 * Always a light plate, in both themes (PROJECT_PLAN.docx item 44's chosen
 * treatment) — the alternative, an invert/hue-rotate filter, risks turning a
 * shaded photographic render into something illegible or garish.
 */

function baseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL;
  return url ? url.replace(/\/$/, "") : null;
}

export function MuscleDiagramPhoto({
  exerciseId,
  exerciseName,
  primaryMuscle,
  secondaryMuscles,
}: {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string | null;
  secondaryMuscles: string[];
}) {
  const [failed, setFailed] = useState(false);
  const base = baseUrl();

  // No base URL configured at all — a deployment/environment gap, not
  // something an end user should see an error card for on every visit.
  if (!base) return null;

  const src = `${base}/${exerciseId}.webp`;

  // The image's own baked-in legend is pixels, invisible to a screen reader
  // and unable to reflect an override correction — built from the database
  // fields instead (PROJECT_PLAN.docx item 42), not from what the picture
  // itself says.
  const alt = [
    `Anatomical muscle diagram for ${exerciseName}.`,
    primaryMuscle ? `Primary: ${primaryMuscle}.` : null,
    secondaryMuscles.length > 0 ? `Secondary: ${secondaryMuscles.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card>
      <CardContent>
        {failed ? (
          // This is now the only muscle-visual on the page (MuscleDiagram no
          // longer renders here), so a failed load has to say something
          // rather than leave a silent, unexplained gap where the section
          // used to be.
          <ErrorState
            size="compact"
            title="Image unavailable"
            description="This exercise's reference diagram couldn't be loaded."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-flat">
            {/* eslint-disable-next-line @next/next/no-img-element -- external
                host varies per environment/store; next/image would need every
                store hostname allow-listed in next.config.ts for something that
                is otherwise a plain <img>. */}
            <img
              src={src}
              alt={alt}
              width={1536}
              height={1024}
              loading="lazy"
              className="h-auto w-full"
              onError={() => setFailed(true)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
