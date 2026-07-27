import { describe, expect, it } from "vitest";
import { NOT_IMPLEMENTED_PROGRESSION_STRATEGY } from "./progression";

describe("NOT_IMPLEMENTED_PROGRESSION_STRATEGY", () => {
  it("throws rather than returning a fabricated suggestion", () => {
    expect(() =>
      NOT_IMPLEMENTED_PROGRESSION_STRATEGY.suggest({
        exerciseId: "EX-0001",
        history: [],
        targetRepsMin: 8,
        targetRepsMax: 12,
      }),
    ).toThrow(/no progression strategy/i);
  });
});
