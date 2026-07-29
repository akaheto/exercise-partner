"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The supplied anatomical render (Epic O) — a real photographic-style body
 * map, distinct from the app's own hand-built MuscleDiagram (which stays in
 * place and keeps using the style guide's teal involvement ramp everywhere
 * else). By design, per PROJECT_PLAN.docx section 4 item 43: the render's
 * orange/navy legend contradicts the app's palette and can't be re-themed
 * (it's baked into the raster), so this is framed as a distinct, deliberately
 * "inserted photograph" rather than blended into the app's own visual
 * language — its own bordered plate, its own caption, own legend.
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

  // No base URL configured, or the specific image failed to load (dead link,
  // blob store issue) — fail silent rather than showing a broken-image icon.
  // The hand-built MuscleDiagram above already covers this exercise.
  if (!base || failed) return null;

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
      <CardHeader>
        <CardTitle className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
          Anatomical reference
        </CardTitle>
      </CardHeader>
      <CardContent>
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
        <p className="mt-2 text-caption text-muted-foreground">
          Supplied anatomical render — its colour legend (primary/secondary) is its own, separate
          from the diagram above.
        </p>
      </CardContent>
    </Card>
  );
}
