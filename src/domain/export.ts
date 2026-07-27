import type { ExportSet } from "@/db/queries/history";

/** Flat, one-row-per-set export shape shared by the CSV and JSON downloads
 * (Epic I4) — dates already normalised to ISO strings so both formats agree. */
export interface ExportRow {
  sessionId: string;
  workoutName: string;
  sessionStatus: string;
  sessionStartedAt: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: string | null;
  weightUnit: string | null;
  reps: number | null;
  notes: string | null;
  completedAt: string;
}

const CSV_COLUMNS: (keyof ExportRow)[] = [
  "sessionId",
  "workoutName",
  "sessionStatus",
  "sessionStartedAt",
  "exerciseId",
  "exerciseName",
  "setNumber",
  "weight",
  "weightUnit",
  "reps",
  "notes",
  "completedAt",
];

export function toExportRows(sets: ExportSet[]): ExportRow[] {
  return sets.map((r) => ({
    sessionId: r.sessionId,
    workoutName: r.workoutName,
    sessionStatus: r.sessionStatus,
    sessionStartedAt: r.sessionStartedAt.toISOString(),
    exerciseId: r.exerciseId,
    exerciseName: r.exerciseName,
    setNumber: r.setNumber,
    weight: r.weight,
    weightUnit: r.weightUnit,
    reps: r.reps,
    notes: r.notes,
    completedAt: r.completedAt.toISOString(),
  }));
}

function escapeCsvField(value: string | number | null): string {
  if (value === null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/** RFC 4180-ish CSV: header row, then one row per set, CRLF line endings. */
export function toCsv(rows: ExportRow[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((row) => CSV_COLUMNS.map((col) => escapeCsvField(row[col])).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}
