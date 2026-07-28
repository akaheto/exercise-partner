/**
 * Imports the source spreadsheet into Postgres.
 *
 * Safe to re-run: source_exercises, source_equipment and source_muscles are
 * upserted by their natural key, and the derived/relationship tables are fully
 * rebuilt from the freshly-parsed sheet each time (they contain nothing the
 * app or its users own — see TECHNICAL_SPEC.docx section 2). App-layer tables
 * (profiles, workouts, sessions, etc.) are never touched.
 *
 * Usage: npm run import:exercises
 */
import "dotenv/config";
import ExcelJS from "exceljs";
import { join } from "node:path";
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
import { computeRowHash, parseMuscleList, parseRelatedLinks, parseYesNo } from "@/domain/importParsing";

const SPREADSHEET_PATH = join(process.cwd(), "data/source/Exercise_Knowledge_Base_Exact_Requested_Schema.xlsx");

/** Reads a worksheet into an array of objects keyed by its header row. */
function sheetToRows(workbook: ExcelJS.Workbook, sheetName: string): Record<string, unknown>[] {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found in workbook`);

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, unknown> = {};
    let hasValue = false;
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const cell = row.getCell(colNumber);
      const raw = cell.value;
      // ExcelJS represents hyperlink cells as { text, hyperlink } objects.
      const value: unknown =
        raw && typeof raw === "object" && "text" in raw ? (raw as { text: unknown }).text : raw;
      if (value !== null && value !== undefined && value !== "") hasValue = true;
      record[header] = value;
    });
    if (hasValue) rows.push(record);
  });
  return rows;
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  // "Not listed" is the spreadsheet's own sentinel for "field not populated"
  // (see the Data Dictionary sheet). Normalised to a real NULL here so every
  // downstream consumer can rely on NULL meaning "no value" instead of having
  // to special-case a magic string.
  if (text === "" || text === "Not listed") return null;
  return text;
}

function int(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function date(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

async function main() {
  console.log(`Reading ${SPREADSHEET_PATH}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(SPREADSHEET_PATH);

  // --- 1. Equipment taxonomy -------------------------------------------------
  const equipmentRows = sheetToRows(workbook, "Equipment Taxonomy");
  for (const row of equipmentRows) {
    await db
      .insert(sourceEquipment)
      .values({
        equipmentId: String(row["Equipment ID"]),
        canonicalName: String(row["Canonical Equipment"]),
        sourceNative: parseYesNo(row["Source Native"]),
        description: str(row["Description"]),
      })
      .onConflictDoUpdate({
        target: sourceEquipment.equipmentId,
        set: {
          canonicalName: sql`excluded.canonical_name`,
          sourceNative: sql`excluded.source_native`,
          description: sql`excluded.description`,
        },
      });
  }
  console.log(`Equipment taxonomy: ${equipmentRows.length} rows upserted`);

  // --- 2. Muscle taxonomy ------------------------------------------------------
  const muscleRows = sheetToRows(workbook, "Muscle Taxonomy");
  const muscleIdByName = new Map<string, string>();
  let nextMuscleNumber = 0;
  for (const row of muscleRows) {
    const id = String(row["Muscle ID"]);
    const name = String(row["Canonical Name"]);
    muscleIdByName.set(name, id);
    const num = Number(id.replace("MU-", ""));
    if (Number.isFinite(num)) nextMuscleNumber = Math.max(nextMuscleNumber, num);
    await db
      .insert(sourceMuscles)
      .values({ muscleId: id, canonicalName: name, source: str(row["Source"]) })
      .onConflictDoUpdate({
        target: sourceMuscles.muscleId,
        set: { canonicalName: sql`excluded.canonical_name`, source: sql`excluded.source` },
      });
  }
  console.log(`Muscle taxonomy: ${muscleRows.length} rows upserted`);

  // --- 3. Source exercises ------------------------------------------------------
  const exerciseRows = sheetToRows(workbook, "Source Exercises");

  const existingHashes = new Map(
    (await db.select({ id: sourceExercises.exerciseId, hash: sourceExercises.sourceRowHash }).from(sourceExercises)).map(
      (r) => [r.id, r.hash],
    ),
  );

  let added = 0;
  let changed = 0;
  let unchanged = 0;
  const unmappedMuscles = new Set<string>();
  const parsedExercises: {
    exerciseId: string;
    primaryMuscle: string | null;
    secondaryMuscles: string[];
    equipment: string | null;
    variations: ReturnType<typeof parseRelatedLinks>;
    alternatives: ReturnType<typeof parseRelatedLinks>;
    progression: ReturnType<typeof parseRelatedLinks>;
    regression: ReturnType<typeof parseRelatedLinks>;
    url: string | null;
  }[] = [];

  for (const row of exerciseRows) {
    const exerciseId = String(row["Exercise ID"]);
    const hash = computeRowHash(row);
    const previous = existingHashes.get(exerciseId);
    if (previous === undefined) added += 1;
    else if (previous !== hash) changed += 1;
    else unchanged += 1;

    const primaryMuscle = str(row["Primary Muscle"]);
    const secondaryMuscles = parseMuscleList(row["Secondary Muscles"]);
    for (const m of [primaryMuscle, ...secondaryMuscles]) {
      if (m && !muscleIdByName.has(m)) unmappedMuscles.add(m);
    }

    parsedExercises.push({
      exerciseId,
      primaryMuscle,
      secondaryMuscles,
      equipment: str(row["Equipment"]),
      variations: parseRelatedLinks(row["Variations"]),
      alternatives: parseRelatedLinks(row["Alternative Exercises"]),
      progression: parseRelatedLinks(row["Progression"]),
      regression: parseRelatedLinks(row["Regression"]),
      url: str(row["Exercise URL"]),
    });

    await db
      .insert(sourceExercises)
      .values({
        exerciseId,
        name: String(row["Exercise Name"]),
        url: str(row["Exercise URL"]),
        videoAvailable: parseYesNo(row["Video Available"]),
        videoUrl: str(row["Video URL"]),
        thumbnailUrl: str(row["Thumbnail Image URL"]),
        primaryMuscle,
        secondaryMuscles: str(row["Secondary Muscles"]),
        stabilizerMuscles: str(row["Stabilizer Muscles"]),
        equipment: str(row["Equipment"]),
        exerciseType: str(row["Exercise Type"]),
        mechanics: str(row["Mechanics"]),
        force: str(row["Force"]),
        experienceLevel: str(row["Experience Level"]),
        startingPosition: str(row["Starting Position"]),
        rangeOfMotion: str(row["Range of Motion"]),
        instructions: str(row["Instructions"]),
        tips: str(row["Tips"]),
        commonMistakes: str(row["Common Mistakes"]),
        variationsRaw: str(row["Variations"]),
        alternativesRaw: str(row["Alternative Exercises"]),
        progressionRaw: str(row["Progression"]),
        regressionRaw: str(row["Regression"]),
        imagesAvailable: parseYesNo(row["Images Available"]),
        numberOfImages: int(row["Number of Images"]),
        gifAvailable: parseYesNo(row["GIF/Animation"]),
        muscleGroupsTag: str(row["Muscle Groups"]),
        equipmentTagsTag: str(row["Equipment Tags"]),
        movementTagsTag: str(row["Movement Tags"]),
        compoundIsolation: str(row["Compound/Isolation Tag"]),
        lastVerified: date(row["Last Verified"]),
        source: str(row["Source"]),
        horizontalPush: parseYesNo(row["Horizontal Push"]),
        verticalPush: parseYesNo(row["Vertical Push"]),
        horizontalPull: parseYesNo(row["Horizontal Pull"]),
        verticalPull: parseYesNo(row["Vertical Pull"]),
        squat: parseYesNo(row["Squat"]),
        hinge: parseYesNo(row["Hinge"]),
        carry: parseYesNo(row["Carry"]),
        rotation: parseYesNo(row["Rotation"]),
        antiRotation: parseYesNo(row["Anti-Rotation"]),
        core: parseYesNo(row["Core"]),
        unilateralBilateral: str(row["Unilateral/Bilateral"]),
        bodyPosition: str(row["Body Position"]),
        bodyRegion: str(row["Body Region"]),
        singleJointMultiJoint: str(row["Single Joint/Multi Joint"]),
        leftRightBoth: str(row["Left/Right/Both"]),
        mobilityRequired: str(row["Mobility Required"]),
        balanceRequired: str(row["Balance Required"]),
        derivedStatus: str(row["Derived Status"]),
        sourceRowHash: hash,
        importedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sourceExercises.exerciseId,
        set: {
          name: sql`excluded.name`,
          url: sql`excluded.url`,
          videoAvailable: sql`excluded.video_available`,
          videoUrl: sql`excluded.video_url`,
          thumbnailUrl: sql`excluded.thumbnail_url`,
          primaryMuscle: sql`excluded.primary_muscle`,
          secondaryMuscles: sql`excluded.secondary_muscles`,
          stabilizerMuscles: sql`excluded.stabilizer_muscles`,
          equipment: sql`excluded.equipment`,
          exerciseType: sql`excluded.exercise_type`,
          mechanics: sql`excluded.mechanics`,
          force: sql`excluded.force`,
          experienceLevel: sql`excluded.experience_level`,
          startingPosition: sql`excluded.starting_position`,
          rangeOfMotion: sql`excluded.range_of_motion`,
          instructions: sql`excluded.instructions`,
          tips: sql`excluded.tips`,
          commonMistakes: sql`excluded.common_mistakes`,
          variationsRaw: sql`excluded.variations_raw`,
          alternativesRaw: sql`excluded.alternatives_raw`,
          progressionRaw: sql`excluded.progression_raw`,
          regressionRaw: sql`excluded.regression_raw`,
          imagesAvailable: sql`excluded.images_available`,
          numberOfImages: sql`excluded.number_of_images`,
          gifAvailable: sql`excluded.gif_available`,
          muscleGroupsTag: sql`excluded.muscle_groups_tag`,
          equipmentTagsTag: sql`excluded.equipment_tags_tag`,
          movementTagsTag: sql`excluded.movement_tags_tag`,
          compoundIsolation: sql`excluded.compound_isolation`,
          lastVerified: sql`excluded.last_verified`,
          source: sql`excluded.source`,
          horizontalPush: sql`excluded.horizontal_push`,
          verticalPush: sql`excluded.vertical_push`,
          horizontalPull: sql`excluded.horizontal_pull`,
          verticalPull: sql`excluded.vertical_pull`,
          squat: sql`excluded.squat`,
          hinge: sql`excluded.hinge`,
          carry: sql`excluded.carry`,
          rotation: sql`excluded.rotation`,
          antiRotation: sql`excluded.anti_rotation`,
          core: sql`excluded.core`,
          unilateralBilateral: sql`excluded.unilateral_bilateral`,
          bodyPosition: sql`excluded.body_position`,
          bodyRegion: sql`excluded.body_region`,
          singleJointMultiJoint: sql`excluded.single_joint_multi_joint`,
          leftRightBoth: sql`excluded.left_right_both`,
          mobilityRequired: sql`excluded.mobility_required`,
          balanceRequired: sql`excluded.balance_required`,
          derivedStatus: sql`excluded.derived_status`,
          sourceRowHash: sql`excluded.source_row_hash`,
          importedAt: sql`excluded.imported_at`,
        },
      });
  }
  console.log(
    `Source exercises: ${exerciseRows.length} rows (added ${added}, changed ${changed}, unchanged ${unchanged})`,
  );

  // --- 3b. Auto-add any muscle name not in the original taxonomy ---------------
  if (unmappedMuscles.size > 0) {
    console.warn(
      `Warning: ${unmappedMuscles.size} muscle name(s) not in Muscle Taxonomy, adding as extensions: ${[...unmappedMuscles].join(", ")}`,
    );
    for (const name of unmappedMuscles) {
      nextMuscleNumber += 1;
      const id = `MU-${String(nextMuscleNumber).padStart(3, "0")}`;
      muscleIdByName.set(name, id);
      await db
        .insert(sourceMuscles)
        .values({ muscleId: id, canonicalName: name, source: "Source Exercises (not in original taxonomy)" })
        .onConflictDoUpdate({
          target: sourceMuscles.muscleId,
          set: { canonicalName: sql`excluded.canonical_name` },
        });
    }
  }

  // --- 4. Rebuild derived tables -------------------------------------------------
  await db.delete(exerciseMuscles);
  await db.delete(exerciseEquipment);
  await db.delete(exerciseLinks);

  const exerciseIds = new Set(parsedExercises.map((e) => e.exerciseId));
  const urlToExerciseId = new Map(
    parsedExercises.filter((e) => e.url).map((e) => [e.url as string, e.exerciseId]),
  );

  let muscleLinkCount = 0;
  let equipmentLinkCount = 0;
  let relatedLinkCount = 0;
  let relatedLinksResolved = 0;

  for (const ex of parsedExercises) {
    if (ex.primaryMuscle) {
      const muscleId = muscleIdByName.get(ex.primaryMuscle);
      if (muscleId) {
        await db.insert(exerciseMuscles).values({ exerciseId: ex.exerciseId, muscleId, role: "primary" });
        muscleLinkCount += 1;
      }
    }
    for (const name of ex.secondaryMuscles) {
      const muscleId = muscleIdByName.get(name);
      if (muscleId) {
        await db.insert(exerciseMuscles).values({ exerciseId: ex.exerciseId, muscleId, role: "secondary" });
        muscleLinkCount += 1;
      }
    }
    if (ex.equipment) {
      // Equipment Taxonomy uses canonical names as both id lookup key and value;
      // resolve by scanning the id map built from source_equipment above.
      const equipmentId = equipmentRows.find((r) => r["Canonical Equipment"] === ex.equipment)?.["Equipment ID"];
      if (equipmentId) {
        await db.insert(exerciseEquipment).values({ exerciseId: ex.exerciseId, equipmentId: String(equipmentId) });
        equipmentLinkCount += 1;
      }
    }

    for (const [relationType, links] of [
      ["variation", ex.variations],
      ["alternative", ex.alternatives],
      ["progression", ex.progression],
      ["regression", ex.regression],
    ] as const) {
      for (const link of links) {
        const toExerciseId = link.url ? urlToExerciseId.get(link.url) ?? null : null;
        if (toExerciseId) relatedLinksResolved += 1;
        await db.insert(exerciseLinks).values({
          fromExerciseId: ex.exerciseId,
          relationType,
          label: link.label,
          url: link.url,
          toExerciseId,
        });
        relatedLinkCount += 1;
      }
    }
  }
  console.log(`Derived muscle links: ${muscleLinkCount}`);
  console.log(`Derived equipment links: ${equipmentLinkCount}`);
  console.log(`Derived related-exercise links: ${relatedLinkCount} (${relatedLinksResolved} resolved to an exercise id)`);

  // --- 5. Rebuild source relationships (substitution candidates) -----------------
  const relationshipRows = sheetToRows(workbook, "Exercise Relationships");
  await db.delete(sourceRelationships);
  let relationshipsSkipped = 0;
  for (const row of relationshipRows) {
    const fromId = String(row["From Exercise ID"]);
    const toId = String(row["To Exercise ID"]);
    if (!exerciseIds.has(fromId) || !exerciseIds.has(toId)) {
      relationshipsSkipped += 1;
      continue;
    }
    await db.insert(sourceRelationships).values({
      fromExerciseId: fromId,
      toExerciseId: toId,
      relationshipType: String(row["Relationship Type"]),
      similarityScore: int(row["Similarity Score"]),
      evidenceType: str(row["Evidence Type"]),
      evidenceUrl: str(row["Evidence URL"]),
      reviewStatus: str(row["Review Status"]) ?? "Unreviewed",
      notes: str(row["Notes"]),
    });
  }
  console.log(
    `Exercise relationships: ${relationshipRows.length - relationshipsSkipped} imported${
      relationshipsSkipped > 0 ? ` (${relationshipsSkipped} skipped — unresolved exercise id)` : ""
    }`,
  );

  console.log("\nImport complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    // postgres-js keeps the process alive until the pool is closed.
    process.exit(process.exitCode ?? 0);
  });
