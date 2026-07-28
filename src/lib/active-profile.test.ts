import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = { get: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const getProfileById = vi.fn();
vi.mock("@/db/queries/profiles", () => ({ getProfileById: (id: string) => getProfileById(id) }));

const { getActiveProfile, getActiveProfileId } = await import("./active-profile");

describe("getActiveProfileId", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    getProfileById.mockReset();
  });

  it("returns null when no cookie is set", async () => {
    cookieStore.get.mockReturnValue(undefined);
    expect(await getActiveProfileId()).toBeNull();
    expect(getProfileById).not.toHaveBeenCalled();
  });

  it("returns the id when the profile exists", async () => {
    cookieStore.get.mockReturnValue({ value: "abc" });
    getProfileById.mockResolvedValue({ id: "abc", displayName: "Ben" });
    expect(await getActiveProfileId()).toBe("abc");
  });

  // A deleted profile leaves the cookie behind. Returning the stale id makes
  // /onboarding redirect away and /profile show "no profile selected".
  it("returns null when the cookie points at a profile that no longer exists", async () => {
    cookieStore.get.mockReturnValue({ value: "deleted-id" });
    getProfileById.mockResolvedValue(null);
    expect(await getActiveProfileId()).toBeNull();
  });
});

describe("getActiveProfile", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    getProfileById.mockReset();
  });

  it("resolves the profile and looks it up exactly once", async () => {
    cookieStore.get.mockReturnValue({ value: "abc" });
    getProfileById.mockResolvedValue({ id: "abc", displayName: "Ben" });

    expect(await getActiveProfile()).toEqual({ id: "abc", displayName: "Ben" });
    expect(getProfileById).toHaveBeenCalledTimes(1);
  });

  it("returns null for a stale cookie", async () => {
    cookieStore.get.mockReturnValue({ value: "deleted-id" });
    getProfileById.mockResolvedValue(null);
    expect(await getActiveProfile()).toBeNull();
  });
});
