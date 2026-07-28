import Image from "next/image";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import type { RelatedLink } from "@/db/queries/exercises";

interface SubstitutionCandidate {
  exerciseId: string;
  name: string;
  thumbnailUrl: string | null;
  primaryMuscle: string | null;
  equipment: string | null;
  similarityScore: number;
}

function MiniExerciseCard({
  exerciseId,
  name,
  thumbnailUrl,
  caption,
}: {
  exerciseId: string;
  name: string;
  thumbnailUrl: string | null;
  caption?: string;
}) {
  return (
    <Link
      href={`/exercises/${exerciseId}`}
      className="focus-ring flex items-center gap-3 rounded-xl border border-border p-2 transition-colors hover:border-primary/50"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Dumbbell className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-small font-medium text-foreground">{name}</p>
        {caption && <p className="text-small text-muted-foreground">{caption}</p>}
      </div>
    </Link>
  );
}

const RELATION_LABELS: Record<string, string> = {
  variation: "Variation",
  alternative: "Alternative",
  progression: "Progression",
  regression: "Regression",
};

export function RelatedExercises({
  substitutions,
  relatedLinks,
}: {
  substitutions: SubstitutionCandidate[];
  relatedLinks: RelatedLink[];
}) {
  const resolvedLinks = relatedLinks.filter((l) => l.toExercise);
  const unresolvedLinks = relatedLinks.filter((l) => !l.toExercise);

  if (substitutions.length === 0 && relatedLinks.length === 0) return null;

  return (
    <div className="space-y-6">
      {substitutions.length > 0 && (
        <div>
          <h2 className="mb-3 text-h3 text-foreground">Suggested substitutions</h2>
          <p className="mb-3 text-small text-muted-foreground">
            Rule-derived candidates, ranked by similarity — check the setup before swapping.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {substitutions.map((s) => (
              <MiniExerciseCard
                key={s.exerciseId}
                exerciseId={s.exerciseId}
                name={s.name}
                thumbnailUrl={s.thumbnailUrl}
                caption={`${s.primaryMuscle ?? ""}${s.equipment ? ` · ${s.equipment}` : ""}`}
              />
            ))}
          </div>
        </div>
      )}

      {resolvedLinks.length > 0 && (
        <div>
          <h2 className="mb-3 text-h3 text-foreground">Variations &amp; related exercises</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {resolvedLinks.map((link, i) => (
              <MiniExerciseCard
                key={`${link.toExercise!.exerciseId}-${i}`}
                exerciseId={link.toExercise!.exerciseId}
                name={link.toExercise!.name}
                thumbnailUrl={link.toExercise!.thumbnailUrl}
                caption={RELATION_LABELS[link.relationType] ?? link.relationType}
              />
            ))}
          </div>
        </div>
      )}

      {unresolvedLinks.length > 0 && (
        <div>
          <h3 className="mb-2 text-caption font-semibold text-muted-foreground">Also mentioned on the source page</h3>
          <ul className="space-y-1">
            {unresolvedLinks.map((link, i) =>
              link.url ? (
                <li key={i}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring text-small text-primary-text hover:underline"
                  >
                    {link.label}
                  </a>
                  <span className="ml-2 text-caption text-muted-foreground">
                    {RELATION_LABELS[link.relationType] ?? link.relationType}
                  </span>
                </li>
              ) : (
                <li key={i} className="text-small text-muted-foreground">
                  {link.label}
                  <span className="ml-2 text-caption">{RELATION_LABELS[link.relationType] ?? link.relationType}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
