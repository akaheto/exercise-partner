import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Functional cover for the admin dashboard beyond its login gate
 * (e2e/admin-auth.spec.ts covers the gate itself; e2e/n7-screenshots.spec.ts
 * explicitly documents itself as a visual pass only, asserting nothing).
 *
 * Exercises deleteProfileAsAdmin end to end — the one action in the app that
 * bypasses a profile's own PIN, reachable from the admin table's per-row
 * Delete button — and confirms the profile is genuinely gone from the
 * database afterward, not just that the row disappeared from the page.
 */

const PROFILE_NAME = `Admin Delete ${Date.now()}`;

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  // Idempotent safety net: a no-op if the test's own deletion already
  // succeeded, a real cleanup if it failed partway through.
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`delete from profiles where display_name = ${PROFILE_NAME}`;
  const left = await sql`select count(*)::int as n from profiles where display_name = ${PROFILE_NAME}`;
  await sql.end();
  if (left[0].n !== 0) throw new Error("cleanup failed — throwaway profile still present");
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Password").fill(process.env.SITE_PASSWORD!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");
}

test("deleting a profile from the admin table removes it from the database", async ({ page }) => {
  test.skip(!process.env.ADMIN_TOKEN, "ADMIN_TOKEN is not set");

  await signIn(page);

  // A throwaway profile via the header switcher, same as pin-security.spec.ts
  // — reachable regardless of admin status or which profile is active.
  await page.getByRole("button", { name: "Switch profile" }).click();
  const switcherDialog = page.getByRole("dialog");
  await expect(switcherDialog.getByLabel("Name")).toBeVisible({ timeout: 15_000 });
  await switcherDialog.getByLabel("Name").fill(PROFILE_NAME);
  await switcherDialog.getByLabel("PIN").fill("1234");
  await switcherDialog.getByRole("button", { name: "Add" }).click();
  await expect(page.locator("ul").getByRole("button", { name: PROFILE_NAME })).toBeVisible({
    timeout: 10_000,
  });
  await page.keyboard.press("Escape");

  await page.goto("/admin/login");
  await page.getByLabel("Site password").fill(process.env.SITE_PASSWORD!);
  await page.getByLabel("Admin token").fill(process.env.ADMIN_TOKEN!);
  await page.getByRole("button", { name: /sign in to admin/i }).click();
  await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible();

  const row = page.getByRole("row", { name: new RegExp(PROFILE_NAME) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(`Delete ${PROFILE_NAME}?`)).toBeVisible();
  // The admin confirm dialog deliberately never asks for a PIN — that's the
  // whole point of this bypass path (see profile-delete-button.tsx).
  await expect(dialog.getByLabel(/enter your pin/i)).not.toBeVisible();
  await dialog.getByRole("button", { name: "Delete profile" }).click();

  // The row leaving the table is the UI-level signal...
  await expect(row).not.toBeVisible();

  // ...but the real proof is the database, per this session's own convention
  // for admin-deletion changes (see the Q3/G5 verification write-ups).
  const sql = postgres(process.env.DATABASE_URL!);
  const remaining = await sql`select count(*)::int as n from profiles where display_name = ${PROFILE_NAME}`;
  await sql.end();
  expect(remaining[0].n).toBe(0);
});
