import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { GuidanceCard } from "@/components/exercise/guidance-card";
import { MuscleDiagram } from "@/components/exercise/muscle-diagram";
import { MuscleDiagramPhoto } from "@/components/exercise/muscle-diagram-photo";
import { RelatedExercises } from "@/components/exercise/related-exercises";
import { VideoEmbed } from "@/components/exercise/video-embed";
import { ExerciseHistorySection } from "@/components/history/exercise-history-section";
import { getExerciseById, getExerciseGuidance, getRelatedLinks, getSubstitutionCandidates } from "@/db/queries/exercises";
import { getExerciseHistory } from "@/db/queries/history";
import { getProfileById } from "@/db/queries/profiles";
import { getActiveProfileId } from "@/lib/active-profile";
import { parseMuscleList } from "@/domain/importParsing";
import { splitIntoSentences } from "@/domain/text";
import { groupExerciseHistoryBySession } from "@/domain/session-history";

const CLASSIFICATION_FIELDS = [
  { label: "Exercise type", key: "exerciseType" },
  { label: "Force", key: "force" },
  { label: "Body region", key: "bodyRegion" },
  { label: "Starting position", key: "startingPosition" },
  { label: "Range of motion", key: "rangeOfMotion" },
] as const;

/**
 * Instructional prose renders at text-body-lg (18px), the style guide's floor
 * for anything you read while setting up or performing a lift — this is the
 * text someone squints at from a bench, not metadata to be scanned.
 */
function BulletedText({ text }: { text: string | null }) {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return <p className="text-body-lg text-muted-foreground">Not provided.</p>;
  return (
    <ul className="list-disc space-y-2 pl-5 text-body-lg text-foreground">
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

  // Fetch profile for user's experience level and training goal
  let profile = null;
  let guidance = null;
  if (profileId) {
    profile = await getProfileById(profileId);
    if (profile) {
      guidance = await getExerciseGuidance(id, profile.experienceLevel, profile.trainingGoal);
    }
  }

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
        className="focus-ring mb-4 inline-flex items-center gap-1 text-small text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to library
      </Link>

      <PageHeader
        className="mb-6"
        title={exercise.name}
        actions={
          <Button disabled title="Workout Builder is not built yet (Epic E)">
            <Dumbbell className="size-4" /> Add to workout
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
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
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <VideoEmbed videoUrl={exercise.videoUrl} sourceUrl={exercise.url} />

          {!exercise.videoAvailable && exercise.thumbnailUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
              <Image src={exercise.thumbnailUrl} alt={exercise.name} fill sizes="640px" className="object-cover" />
            </div>
          )}

          {guidance && profile && (
            <GuidanceCard guidance={guidance} userLevel={profile.experienceLevel} userGoal={profile.trainingGoal} />
          )}

          <section>
            <h2 className="mb-2 text-h3 text-foreground">Instructions</h2>
            <BulletedText text={exercise.instructions} />
          </section>

          {exercise.tips && (
            <section>
              <h2 className="mb-2 text-h3 text-foreground">Tips &amp; cautions</h2>
              <BulletedText text={exercise.tips} />
            </section>
          )}

          {exercise.commonMistakes && (
            <section>
              <h2 className="mb-2 text-h3 text-foreground">Common mistakes</h2>
              <BulletedText text={exercise.commonMistakes} />
            </section>
          )}

          <Card>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {CLASSIFICATION_FIELDS.map(({ label, key }) => (
                  <div key={label}>
                    <dt className="text-caption text-muted-foreground">{label}</dt>
                    <dd className="text-body text-foreground">{exercise[key] ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {exercise.derivedStatus && (
            <p className="text-small text-muted-foreground">
              Classification fields on this page (body position, range, body position, mobility/balance demand) are{" "}
              {exercise.derivedStatus.toLowerCase()} — treat them as a starting point, not verified fact.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <MuscleDiagram primaryMuscle={exercise.primaryMuscle} secondaryMuscles={secondaryMuscles} />
          <MuscleDiagramPhoto
            exerciseId={exercise.exerciseId}
            exerciseName={exercise.name}
            primaryMuscle={exercise.primaryMuscle}
            secondaryMuscles={secondaryMuscles}
          />
          {profileId && <ExerciseHistorySection points={history} />}
          <RelatedExercises substitutions={substitutions} relatedLinks={relatedLinks} />
        </div>
      </div>
    </div>
  );
}
