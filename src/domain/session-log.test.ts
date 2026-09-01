import { describe, expect, it } from "vitest";
import { logSetSchema } from "./session-log";

function validInput(overrides: Partial<Parameters<typeof logSetSchema.parse>[0]> = {}) {
  return {
    exerciseId: "EX-0001",
    setNumber: 1,
    weight: 100,
    weightUnit: "kg" as const,
    reps: 10,
    notes: null,
    ...overrides,
  };
}

describe("logSetSchema", () => {
  it("accepts a well-formed set", () => {
    expect(logSetSchema.parse(validInput())).toEqual(validInput());
  });

  it("accepts null weight/weightUnit/reps/notes (a bodyweight set logged without numbers)", () => {
    const input = validInput({ weight: null, weightUnit: null, reps: null, notes: null });
    expect(logSetSchema.parse(input)).toEqual(input);
  });

  it("rejects a negative weight", () => {
    expect(logSetSchema.safeParse(validInput({ weight: -5 })).success).toBe(false);
  });

  // Postgres numeric columns store the literal NaN rather than rejecting it,
  // so this has to be caught here — see src/domain/session-log.ts.
  it("rejects NaN weight", () => {
    expect(logSetSchema.safeParse(validInput({ weight: NaN })).success).toBe(false);
  });

  it("rejects Infinity weight", () => {
    expect(logSetSchema.safeParse(validInput({ weight: Infinity })).success).toBe(false);
  });

  it("rejects an absurdly large weight", () => {
    expect(logSetSchema.safeParse(validInput({ weight: 999_999 })).success).toBe(false);
  });

  it("rejects a negative rep count", () => {
    expect(logSetSchema.safeParse(validInput({ reps: -1 })).success).toBe(false);
  });

  it("rejects a non-integer rep count", () => {
    expect(logSetSchema.safeParse(validInput({ reps: 10.5 })).success).toBe(false);
  });

  it("rejects notes over 500 characters", () => {
    expect(logSetSchema.safeParse(validInput({ notes: "x".repeat(501) })).success).toBe(false);
  });

  it("rejects an empty exerciseId", () => {
    expect(logSetSchema.safeParse(validInput({ exerciseId: "" })).success).toBe(false);
  });

  it("rejects setNumber below 1", () => {
    expect(logSetSchema.safeParse(validInput({ setNumber: 0 })).success).toBe(false);
  });

  it("rejects an invalid weightUnit", () => {
    expect(logSetSchema.safeParse(validInput({ weightUnit: "stone" })).success).toBe(false);
  });
});
