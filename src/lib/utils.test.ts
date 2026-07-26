import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("keeps the last of conflicting Tailwind utilities", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy and conditional values", () => {
    expect(cn("a", false && "b", undefined, null, "")).toBe("a");
  });

  it("returns an empty string when given no usable input", () => {
    expect(cn()).toBe("");
    expect(cn(undefined, null, false)).toBe("");
  });
});
