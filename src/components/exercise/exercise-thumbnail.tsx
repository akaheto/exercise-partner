"use client";

import { useState } from "react";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * The one shared way to show an exercise's picture, everywhere it appears:
 * the Exercise Library grid, the workout builder's exercise picker, the
 * exercise detail page, and Workout Mode. Tries three sources in order,
 * falling forward on failure rather than showing a broken image:
 *
 *  1. The photorealistic photo (ENHANCEMENTS.docx, PROJECT_PLAN.docx item
 *     63) — covers 1,218 of 1,271 exercises.
 *  2. The hotlinked spreadsheet thumbnail (thumbnailUrl) — the previous
 *     sole source, still needed for the 53 exercises the photo doesn't
 *     cover. Unoptimized: this host's Cloudflare protection 403s Vercel's
 *     server-side image-optimization fetch (PROJECT_PLAN.docx item 61), the
 *     same reason exercise-card.tsx and friends already used it.
 *  3. `fallback` — whatever the caller wants shown when neither exists or
 *     both fail (typically an icon placeholder).
 *
 * The photo lives on a fixed Vercel Blob host this app controls, so
 * next/image's normal optimize path is safe there specifically — only the
 * thumbnail tier needs `unoptimized`.
 */

function exercisePhotoUrl(exerciseId: string): string | null {
  const base = process.env.NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL;
  return base ? `${base.replace(/\/$/, "")}/exercise-photos/${exerciseId}.webp` : null;
}

type Stage = "photo" | "thumbnail" | "fallback";

export function ExerciseThumbnail({
  exerciseId,
  thumbnailUrl,
  alt,
  sizes,
  className,
  fallback = null,
  priority = false,
}: {
  exerciseId: string;
  thumbnailUrl: string | null;
  alt: string;
  sizes: string;
  className?: string;
  fallback?: ReactNode;
  /** Set for the one hero-position image above the fold (the exercise
   * detail page and Workout Mode) — Next.js otherwise warns that the
   * Largest Contentful Paint image should load eagerly, not lazily. Grid
   * cards and picker rows stay lazy; there are too many on screen at once
   * for eager loading to help. */
  priority?: boolean;
}) {
  const photoUrl = exercisePhotoUrl(exerciseId);
  const [stage, setStage] = useState<Stage>(photoUrl ? "photo" : thumbnailUrl ? "thumbnail" : "fallback");

  if (stage === "fallback") return <>{fallback}</>;

  if (stage === "photo") {
    return (
      <Image
        src={photoUrl!}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        onError={() => setStage(thumbnailUrl ? "thumbnail" : "fallback")}
      />
    );
  }

  return (
    <Image
      src={thumbnailUrl!}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setStage("fallback")}
    />
  );
}
