import { describe, expect, it } from "vitest";
import { mergeOverrides } from "./mergeOverrides";

describe("mergeOverrides", () => {
  const source = { exerciseId: "EX-0001", name: "Squat", instructions: "Original text" };

  it("returns the source unchanged when there are no overrides", () => {
    expect(mergeOverrides(source, [], null)).toEqual(source);
  });

  it("applies a global override", () => {
    const result = mergeOverrides(
      source,
      [{ field: "instructions", value: "Corrected text", profileId: null }],
      null,
    );
    expect(result.instructions).toBe("Corrected text");
  });

  it("applies a global override even when viewed with a profile id", () => {
    const result = mergeOverrides(
      source,
      [{ field: "instructions", value: "Corrected text", profileId: null }],
      "profile-1",
    );
    expect(result.instructions).toBe("Corrected text");
  });

  it("a profile-specific override takes precedence over a global one for the same field", () => {
    const result = mergeOverrides(
      source,
      [
        { field: "instructions", value: "Global correction", profileId: null },
        { field: "instructions", value: "Personal note", profileId: "profile-1" },
      ],
      "profile-1",
    );
    expect(result.instructions).toBe("Personal note");
  });

  it("ignores a profile-specific override belonging to a different profile", () => {
    const result = mergeOverrides(
      source,
      [{ field: "instructions", value: "Someone else's note", profileId: "profile-2" }],
      "profile-1",
    );
    expect(result.instructions).toBe("Original text");
  });

  it("ignores an override for a field that does not exist on the source, rather than injecting it", () => {
    const result = mergeOverrides(
      source,
      [{ field: "notARealField", value: "should not appear", profileId: null }],
      null,
    );
    expect(result).not.toHaveProperty("notARealField");
    expect(result).toEqual(source);
  });

  it("does not mutate the original source object", () => {
    const original = { ...source };
    mergeOverrides(source, [{ field: "name", value: "Front Squat", profileId: null }], null);
    expect(source).toEqual(original);
  });

  it("applies overrides across multiple fields independently", () => {
    const result = mergeOverrides(
      source,
      [
        { field: "name", value: "Front Squat", profileId: null },
        { field: "instructions", value: "New instructions", profileId: "profile-1" },
      ],
      "profile-1",
    );
    expect(result).toEqual({
      exerciseId: "EX-0001",
      name: "Front Squat",
      instructions: "New instructions",
    });
  });
});
