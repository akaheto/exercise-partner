/**
 * Data-quality report for the imported database. Run after npm run
 * import:exercises to sanity-check row counts and see how sparse the
 * optional fields actually are.
 *
 * Usage: npm run db:report
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  exerciseEquipment,
  exerciseLinks,
  exerciseMuscles,
  sourceEquipment,
  sourceExercises,
  sourceMuscles,
  sourceRelationships,
} from "@/db/schema";

async function countRows(table: Parameters<typeof db.$count>[0]) {
  return db.$count(table);
}

async function main() {
  console.log("=== Row counts ===");
  console.log("source_exercises:     ", await countRows(sourceExercises));
  console.log("source_equipment:     ", await countRows(sourceEquipment));
  console.log("source_muscles:       ", await countRows(sourceMuscles));
  console.log("source_relationships: ", await countRows(sourceRelationships));
  console.log("exercise_muscles:     ", await countRows(exerciseMuscles));
  console.log("exercise_equipment:   ", await countRows(exerciseEquipment));
  console.log("exercise_links:       ", await countRows(exerciseLinks));

  console.log("\n=== Sparse-field audit (% of 1,218 exercises with real content) ===");
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      hasVideo: sql<number>`count(*) filter (where ${sourceExercises.videoAvailable})`,
      hasThumbnail: sql<number>`count(*) filter (where ${sourceExercises.thumbnailUrl} is not null)`,
      hasVariations: sql<number>`count(*) filter (where ${sourceExercises.variationsRaw} is not null)`,
      hasAlternatives: sql<number>`count(*) filter (where ${sourceExercises.alternativesRaw} is not null)`,
      hasProgression: sql<number>`count(*) filter (where ${sourceExercises.progressionRaw} is not null)`,
      hasRegression: sql<number>`count(*) filter (where ${sourceExercises.regressionRaw} is not null)`,
      hasStabilizers: sql<number>`count(*) filter (where ${sourceExercises.stabilizerMuscles} is not null)`,
      genericBodyPosition: sql<number>`count(*) filter (where ${sourceExercises.bodyPosition} = 'Varies / Not specified')`,
      unreviewedDerived: sql<number>`count(*) filter (where ${sourceExercises.derivedStatus} like 'Rule Derived%')`,
    })
    .from(sourceExercises);

  const pct = (n: number) => `${((n / row.total) * 100).toFixed(1)}%`;
  console.log(`Video available:              ${row.hasVideo} (${pct(row.hasVideo)})`);
  console.log(`Thumbnail image:              ${row.hasThumbnail} (${pct(row.hasThumbnail)})`);
  console.log(`Variations listed:            ${row.hasVariations} (${pct(row.hasVariations)})`);
  console.log(`Alternative exercises listed: ${row.hasAlternatives} (${pct(row.hasAlternatives)})`);
  console.log(`Progression listed:           ${row.hasProgression} (${pct(row.hasProgression)})`);
  console.log(`Regression listed:            ${row.hasRegression} (${pct(row.hasRegression)})`);
  console.log(`Stabilizer muscles listed:    ${row.hasStabilizers} (${pct(row.hasStabilizers)})`);
  console.log(`Generic "Varies" body position: ${row.genericBodyPosition} (${pct(row.genericBodyPosition)})`);
  console.log(`Unreviewed derived status:    ${row.unreviewedDerived} (${pct(row.unreviewedDerived)})`);

  console.log("\n=== Relationship quality ===");
  const [relStats] = await db
    .select({
      total: sql<number>`count(*)`,
      avgSimilarity: sql<number>`avg(${sourceRelationships.similarityScore})`,
      minSimilarity: sql<number>`min(${sourceRelationships.similarityScore})`,
      maxSimilarity: sql<number>`max(${sourceRelationships.similarityScore})`,
    })
    .from(sourceRelationships);
  console.log(
    `${relStats.total} candidate substitutions, similarity ${relStats.minSimilarity}-${relStats.maxSimilarity} (avg ${Number(relStats.avgSimilarity).toFixed(1)})`,
  );

  const [avgSubsPerExercise] = await db.execute<{ avg: string }>(
    sql`select avg(cnt)::numeric(10,1) as avg from (select from_exercise_id, count(*) as cnt from source_relationships group by from_exercise_id) t`,
  );
  console.log(`Average candidate substitutions per exercise: ${avgSubsPerExercise.avg}`);

  console.log("\n=== Muscle taxonomy extensions ===");
  const extensions = await db
    .select({ id: sourceMuscles.muscleId, name: sourceMuscles.canonicalName })
    .from(sourceMuscles)
    .where(sql`${sourceMuscles.source} like '%not in original taxonomy%'`);
  if (extensions.length === 0) {
    console.log("None — every muscle name in Source Exercises matched the original taxonomy.");
  } else {
    for (const e of extensions) console.log(`${e.id}: ${e.name} (auto-added — not in original 22-row taxonomy)`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
