import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MuscleDiagram } from "@/components/exercise/muscle-diagram";
import { RelatedExercises } from "@/components/exercise/related-exercises";
import { VideoEmbed } from "@/components/exercise/video-embed";
import { ExerciseHistorySection } from "@/components/history/exercise-history-section";
import { getExerciseById, getRelatedLinks, getSubstitutionCandidates } from "@/db/queries/exercises";
import { getExerciseHistory } from "@/db/queries/history";
import { getActiveProfileId } from "@/lib/active-profile";
import { parseMuscleList } from "@/domain/importParsing";
import { splitIntoSentences } from "@/domain/text";
import { groupExerciseHistoryBySession } from "@/domain/session-history";

function BulletedText({ text }: { text: string | null }) {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return <p className="text-sm text-muted-foreground">Not provided.</p>;
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
      {sentences.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await getActiveProfileId();

  const exercise = await getExerciseById(id, profileId);
  if (!exercise) notFound();

  const [substitutions, relatedLinks, rawHistory] = await Promise.all([
    getSubstitutionCandidates(id),
    getRelatedLinks(id),
    profileId ? getExerciseHistory(id, profileId) : Promise.resolve([]),
  ]);

  const secondaryMuscles = parseMuscleList(exercise.secondaryMuscles);
  const history = groupExerciseHistoryBySession(rawHistory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Link
        href="/exercises"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to library
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{exercise.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exercise.primaryMuscle && <Badge>{exercise.primaryMuscle}</Badge>}
            {secondaryMuscles.map((m) => (
              <Badge key={m} variant="secondary">
                {m}
              </Badge>
            ))}
            {exercise.equipment && <Badge variant="outline">{exercise.equipment}</Badge>}
            {exercise.mechanics && <Badge variant="outline">{exercise.mechanics}</Badge>}
            {exercise.experienceLevel && <Badge variant="outline">{exercise.experienceLevel}</Badge>}
          </div>
        </div>
        <Button disabled className="shrink-0" title="Workout Builder is not built yet (Epic E)">
          <Dumbbell className="size-4" /> Add to workout
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <VideoEmbed videoUrl={exercise.videoUrl} sourceUrl={exercise.url} />

          {!exercise.videoAvailable && exercise.thumbnailUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
              <Image src={exercise.thumbnailUrl} alt={exercise.name} fill sizes="640px" className="object-cover" />
            </div>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Instructions</h2>
            <BulletedText text={exercise.instructions} />
          </section>

          {exercise.tips && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Tips &amp; cautions</h2>
              <BulletedText text={exercise.tips} />
            </section>
          )}

          {exercise.commonMistakes && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Common mistakes</h2>
              <BulletedText text={exercise.commonMistakes} />
            </section>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Exercise type</dt>
              <dd className="text-foreground">{exercise.exerciseType ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Force</dt>
              <dd className="text-foreground">{exercise.force ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Body region</dt>
              <dd className="text-foreground">{exercise.bodyRegion ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Starting position</dt>
              <dd className="text-foreground">{exercise.startingPosition ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Range of motion</dt>
              <dd className="text-foreground">{exercise.rangeOfMotion ?? "—"}</dd>
            </div>
          </dl>

          {exercise.derivedStatus && (
            <p className="text-xs text-muted-foreground">
              Classification fields on this page (body position, range, body position, mobility/balance demand) are{" "}
              {exercise.derivedStatus.toLowerCase()} — treat them as a starting point, not verified fact.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <MuscleDiagram primaryMuscle={exercise.primaryMuscle} secondaryMuscles={secondaryMuscles} />
          {profileId && <ExerciseHistorySection points={history} />}
          <RelatedExercises substitutions={substitutions} relatedLinks={relatedLinks} />
        </div>
      </div>
    </div>
  );
}
