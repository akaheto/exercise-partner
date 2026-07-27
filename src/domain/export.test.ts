import { describe, expect, it } from "vitest";
import { toCsv, type ExportRow } from "./export";

function row(overrides: Partial<ExportRow> = {}): ExportRow {
  return {
    sessionId: "s1",
    workoutName: "Push Day",
    sessionStatus: "completed",
    sessionStartedAt: "2026-07-20T10:00:00.000Z",
    exerciseId: "EX-0001",
    exerciseName: "Bench Press",
    setNumber: 1,
    weight: "100.00",
    weightUnit: "kg",
    reps: 10,
    notes: null,
    completedAt: "2026-07-20T10:05:00.000Z",
    ...overrides,
  };
}

describe("toCsv", () => {
  it("produces just the header for an empty list", () => {
    expect(toCsv([])).toBe(
      "sessionId,workoutName,sessionStatus,sessionStartedAt,exerciseId,exerciseName,setNumber,weight,weightUnit,reps,notes,completedAt\r\n",
    );
  });

  it("renders a plain row without quoting", () => {
    const csv = toCsv([row()]);
    expect(csv).toContain("s1,Push Day,completed,2026-07-20T10:00:00.000Z,EX-0001,Bench Press,1,100.00,kg,10,,2026-07-20T10:05:00.000Z");
  });

  it("renders null fields as empty, not the string 'null'", () => {
    const csv = toCsv([row({ weight: null, reps: null, notes: null })]);
    expect(csv).not.toContain("null");
  });

  it("quotes and escapes a field containing a comma", () => {
    const csv = toCsv([row({ workoutName: "Push, Pull & Legs" })]);
    expect(csv).toContain('"Push, Pull & Legs"');
  });

  it("quotes and escapes a field containing a double quote", () => {
    const csv = toCsv([row({ notes: 'felt "heavy" today' })]);
    expect(csv).toContain('"felt ""heavy"" today"');
  });

  it("quotes a field containing a newline", () => {
    const csv = toCsv([row({ notes: "line one\nline two" })]);
    expect(csv).toContain('"line one\nline two"');
  });
});
