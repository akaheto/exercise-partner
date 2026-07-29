import "dotenv/config";
import { test, expect } from "@playwright/test";

/**
 * Regression cover for the admin gate.
 *
 * Until this was fixed, `admin_session` was set to the literal string
 * "authenticated" and the page admitted anyone presenting it, so a single
 * hand-set cookie granted full admin access — including deleting any profile
 * and its entire training history — without ADMIN_TOKEN ever being supplied.
 * The first test below is that exact attack, and it must fail.
 *
 * Needs ADMIN_TOKEN in the environment; the gate now refuses to run without
 * it rather than falling back to a hardcoded default.
 */

test.describe.configure({ mode: "serial" });

async function signIntoSite(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Password").fill(process.env.SITE_PASSWORD!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");
}

test("a hand-set admin_session cookie does not grant admin access", async ({ page, context }) => {
  await signIntoSite(page);

  await context.addCookies([
    { name: "admin_session", value: "authenticated", domain: "localhost", path: "/" },
  ]);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByText("Admin access")).toBeVisible();
});

test("an arbitrary signature-shaped cookie does not grant admin access", async ({ page, context }) => {
  await signIntoSite(page);

  const farFuture = Math.floor(Date.now() / 1000) + 86_400;
  await context.addCookies([
    {
      name: "admin_session",
      value: `${farFuture}.${"a".repeat(64)}`,
      domain: "localhost",
      path: "/",
    },
  ]);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("the correct site password and admin token do grant access", async ({ page }) => {
  test.skip(!process.env.ADMIN_TOKEN, "ADMIN_TOKEN is not set");
  await signIntoSite(page);

  await page.goto("/admin/login");
  await page.getByLabel("Site password").fill(process.env.SITE_PASSWORD!);
  await page.getByLabel("Admin token").fill(process.env.ADMIN_TOKEN!);
  await page.getByRole("button", { name: /sign in to admin/i }).click();

  await expect(page).toHaveURL("/admin");
  await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible();
});

test("a wrong admin token is refused even with the right site password", async ({ page }) => {
  test.skip(!process.env.ADMIN_TOKEN, "ADMIN_TOKEN is not set");
  await signIntoSite(page);

  await page.goto("/admin/login");
  await page.getByLabel("Site password").fill(process.env.SITE_PASSWORD!);
  await page.getByLabel("Admin token").fill("definitely-not-the-token");
  await page.getByRole("button", { name: /sign in to admin/i }).click();

  await expect(page.getByText("Invalid credentials")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});
