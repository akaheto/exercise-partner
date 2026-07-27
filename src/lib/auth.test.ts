import { describe, expect, it } from "vitest";
import { signSiteToken, verifySitePassword, verifySiteToken } from "./auth";

describe("signSiteToken / verifySiteToken", () => {
  it("a token signed with a secret verifies against that same secret", async () => {
    const token = await signSiteToken("secret-a");
    expect(await verifySiteToken(token, "secret-a")).toBe(true);
  });

  it("a token signed with a different secret does not verify", async () => {
    const token = await signSiteToken("secret-a");
    expect(await verifySiteToken(token, "secret-b")).toBe(false);
  });

  it("is deterministic for the same secret", async () => {
    expect(await signSiteToken("secret-a")).toBe(await signSiteToken("secret-a"));
  });

  it("rejects garbage input rather than throwing", async () => {
    expect(await verifySiteToken("not-a-real-token", "secret-a")).toBe(false);
    expect(await verifySiteToken("", "secret-a")).toBe(false);
  });
});

describe("verifySitePassword", () => {
  it("accepts an exact match", () => {
    expect(verifySitePassword("correct horse", "correct horse")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifySitePassword("wrong", "correct horse")).toBe(false);
  });

  it("rejects an empty submission against a real password", () => {
    expect(verifySitePassword("", "correct horse")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(verifySitePassword("Correct Horse", "correct horse")).toBe(false);
  });

  it("handles a submitted value longer than the real password without throwing", () => {
    expect(verifySitePassword("correct horse battery staple", "correct horse")).toBe(false);
  });
});
