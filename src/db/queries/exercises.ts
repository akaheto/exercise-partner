import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  exerciseEquipment,
  exerciseLinks,
  exerciseMuscles,
  exerciseOverrides,
  sourceEquipment,
  sourceExercises,
  sourceMuscles,
  sourceRelationships,
} from "@/db/schema";
import { mergeOverrides } from "@/domain/mergeOverrides";
import { PAGE_SIZE, type ExerciseFilters } from "@/domain/exercise-filters";

/**
 * Fetches a single exercise with any applicable overrides merged in — the
 * read-time half of the two-layer data principle. Returns null if no exercise
 * with that id exists. See src/domain/mergeOverrides.ts for the (unit-tested)
 * merge logic; this wrapper is intentionally thin.
 */
export async function getExerciseById(exerciseId: string, profileId: string | null = null) {
  const [source] = await db.select().from(sourceExercises).where(eq(sourceExercises.exerciseId, exerciseId));
  if (!source) return null;

  const overrideRows = await db
    .select({
      field: exerciseOverrides.field,
      value: exerciseOverrides.value,
      profileId: exerciseOverrides.profileId,
    })
    .from(exerciseOverrides)
    .where(
      and(
        eq(exerciseOverrides.exerciseId, exerciseId),
        profileId
          ? or(isNull(exerciseOverrides.profileId), eq(exerciseOverrides.profileId, profileId))
          : isNull(exerciseOverrides.profileId),
      ),
    );

  return mergeOverrides(source, overrideRows, profileId);
}

function buildWhereClause(filters: ExerciseFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.q) conditions.push(ilike(sourceExercises.name, `%${filters.q}%`));
  if (filters.type) conditions.push(eq(sourceExercises.exerciseType, filters.type));
  if (filters.mechanics) conditions.push(eq(sourceExercises.mechanics, filters.mechanics));
  if (filters.force) conditions.push(eq(sourceExercises.force, filters.force));
  if (filters.level) conditions.push(eq(sourceExercises.experienceLevel, filters.level));
  if (filters.region) conditions.push(eq(sourceExercises.bodyRegion, filters.region));
  if (filters.videoOnly) conditions.push(eq(sourceExercises.videoAvailable, true));

  if (filters.muscle) {
    conditions.push(
      inArray(
        sourceExercises.exerciseId,
        db
          .select({ id: exerciseMuscles.exerciseId })
          .from(exerciseMuscles)
          .innerJoin(sourceMuscles, eq(exerciseMuscles.muscleId, sourceMuscles.muscleId))
          .where(eq(sourceMuscles.canonicalName, filters.muscle)),
      ),
    );
  }

  if (filters.equipment) {
    conditions.push(
      inArray(
        sourceExercises.exerciseId,
        db
          .select({ id: exerciseEquipment.exerciseId })
          .from(exerciseEquipment)
          .innerJoin(sourceEquipment, eq(exerciseEquipment.equipmentId, sourceEquipment.equipmentId))
          .where(eq(sourceEquipment.canonicalName, filters.equipment)),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

const EXPERIENCE_LEVEL_RANK = sql`case ${sourceExercises.experienceLevel}
  when 'Beginner' then 0 when 'Intermediate' then 1 when 'Advanced' then 2 else 3 end`;

function buildOrderBy(sort: ExerciseFilters["sort"]) {
  switch (sort) {
    case "name-desc":
      return [desc(sourceExercises.name)];
    case "muscle":
      return [asc(sourceExercises.primaryMuscle), asc(sourceExercises.name)];
    case "equipment":
      return [asc(sourceExercises.equipment), asc(sourceExercises.name)];
    case "level":
      return [asc(EXPERIENCE_LEVEL_RANK), asc(sourceExercises.name)];
    case "name-asc":
    default:
      return [asc(sourceExercises.name)];
  }
}

export async function listExercises(filters: ExerciseFilters) {
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(sourceExercises)
      .where(where)
      .orderBy(...orderBy)
      .limit(PAGE_SIZE)
      .offset((filters.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(sourceExercises).where(where),
  ]);

  return { rows, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function listMuscleOptions() {
  return db
    .select({ name: sourceMuscles.canonicalName })
    .from(sourceMuscles)
    .orderBy(asc(sourceMuscles.canonicalName));
}

export function listEquipmentOptions() {
  return db
    .select({ name: sourceEquipment.canonicalName })
    .from(sourceEquipment)
    .orderBy(asc(sourceEquipment.canonicalName));
}

const SUBSTITUTION_LIMIT = 6;

/**
 * Rule-derived substitution candidates (source_relationships), highest
 * similarity first. Always presented as suggestions, never equivalences —
 * see TECHNICAL_SPEC.docx "Data quality".
 */
export function getSubstitutionCandidates(exerciseId: string) {
  return db
    .select({
      exerciseId: sourceExercises.exerciseId,
      name: sourceExercises.name,
      thumbnailUrl: sourceExercises.thumbnailUrl,
      primaryMuscle: sourceExercises.primaryMuscle,
      equipment: sourceExercises.equipment,
      similarityScore: sourceRelationships.similarityScore,
    })
    .from(sourceRelationships)
    .innerJoin(sourceExercises, eq(sourceRelationships.toExerciseId, sourceExercises.exerciseId))
    .where(eq(sourceRelationships.fromExerciseId, exerciseId))
    .orderBy(desc(sourceRelationships.similarityScore))
    .limit(SUBSTITUTION_LIMIT);
}

export interface RelatedLink {
  relationType: string;
  label: string;
  url: string | null;
  toExercise: { exerciseId: string; name: string; thumbnailUrl: string | null } | null;
}

/**
 * Human-curated links parsed from the source spreadsheet's Variations /
 * Alternative Exercises / Progression / Regression columns — distinct from
 * the rule-derived source_relationships candidates above.
 */
export async function getRelatedLinks(exerciseId: string): Promise<RelatedLink[]> {
  const rows = await db
    .select({
      relationType: exerciseLinks.relationType,
      label: exerciseLinks.label,
      url: exerciseLinks.url,
      toExerciseId: sourceExercises.exerciseId,
      toExerciseName: sourceExercises.name,
      toExerciseThumbnail: sourceExercises.thumbnailUrl,
    })
    .from(exerciseLinks)
    .leftJoin(sourceExercises, eq(exerciseLinks.toExerciseId, sourceExercises.exerciseId))
    .where(eq(exerciseLinks.fromExerciseId, exerciseId));

  return rows.map((row) => ({
    relationType: row.relationType,
    label: row.label,
    url: row.url,
    toExercise: row.toExerciseId
      ? { exerciseId: row.toExerciseId, name: row.toExerciseName!, thumbnailUrl: row.toExerciseThumbnail }
      : null,
  }));
}
