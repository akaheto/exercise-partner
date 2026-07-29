import { describe, it, expect } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  adminTokenExpiry,
  constantTimeEqual,
  signAdminToken,
  verifyAdminToken,
} from "./admin-auth";

const SECRET = "test-session-secret-0123456789abcdef";
const NOW = 1_800_000_000_000; // fixed clock so expiry cases are deterministic

async function freshToken(secret = SECRET) {
  return signAdminToken(secret, adminTokenExpiry(NOW));
}

describe("admin session tokens", () => {
  it("accepts a token it just signed", async () => {
    const token = await freshToken();
    expect(await verifyAdminToken(token, SECRET, NOW)).toBe(true);
  });

  // The whole point of the change: the old cookie was this exact string.
  it("rejects the literal 'authenticated' the previous implementation used", async () => {
    expect(await verifyAdminToken("authenticated", SECRET, NOW)).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAdminToken("some-other-secret", adminTokenExpiry(NOW));
    expect(await verifyAdminToken(token, SECRET, NOW)).toBe(false);
  });

  it("rejects a token whose expiry has been pushed out by hand", async () => {
    const token = await freshToken();
    const [, signature] = token.split(".");
    const forged = `${adminTokenExpiry(NOW) + 86_400}.${signature}`;

    expect(await verifyAdminToken(forged, SECRET, NOW)).toBe(false);
  });

  it("rejects a token whose signature has been tampered with", async () => {
    const token = await freshToken();
    const flipped = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(await verifyAdminToken(flipped, SECRET, NOW)).toBe(false);
  });

  it("enforces expiry on the server, not just via cookie maxAge", async () => {
    const token = await freshToken();
    const justBefore = NOW + ADMIN_SESSION_MAX_AGE_SECONDS * 1000 - 1000;
    const justAfter = NOW + ADMIN_SESSION_MAX_AGE_SECONDS * 1000 + 1000;

    expect(await verifyAdminToken(token, SECRET, justBefore)).toBe(true);
    expect(await verifyAdminToken(token, SECRET, justAfter)).toBe(false);
  });

  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["no separator", "deadbeef"],
    ["empty expiry", ".deadbeef"],
    ["non-numeric expiry", "abc.deadbeef"],
    ["negative expiry", "-1.deadbeef"],
    ["no signature", "1800000000."],
    ["float expiry", "1.5.deadbeef"],
  ])("returns false rather than throwing on a %s token", async (_label, token) => {
    await expect(verifyAdminToken(token, SECRET, NOW)).resolves.toBe(false);
  });
});

describe("constantTimeEqual", () => {
  it("matches identical strings and rejects everything else", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
    expect(constantTimeEqual("", "")).toBe(true);
    expect(constantTimeEqual("", "a")).toBe(false);
  });
});
