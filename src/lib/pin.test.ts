import { describe, expect, it } from "vitest";
import { hashPin, isValidPin, verifyPin } from "./pin";

describe("pin", () => {
  it("verifies a correct pin", () => {
    expect(verifyPin("1234", hashPin("1234"))).toBe(true);
  });

  it("rejects an incorrect pin", () => {
    expect(verifyPin("9999", hashPin("1234"))).toBe(false);
  });

  it("does not store the pin in plaintext", () => {
    expect(hashPin("1234")).not.toContain("1234");
  });

  it("accepts 4-6 digit pins", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
  });

  it("rejects pins that are too short, too long, or non-numeric", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});
