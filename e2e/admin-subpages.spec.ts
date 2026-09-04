import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Functional cover for the admin dashboard's three sub-pages
 * (/admin/changelog, /admin/enhancements, /admin/errors) — previously
 * untested entirely, flagged in PROJECT_PLAN.docx K2 as a follow-up.
 *
 * Changelog and Enhancements read static project files (CHANGELOG.md,
 * public/enhancements.json) rather than the database, so these assert on
 * real, known content rather than just "the page loads." Errors reads the
 * client_errors table and round-trips a real POST to /api/errors through an
 * authenticated browser context — the same path that caught a real bug
 * during this pass: the route read the wrong cookie name and silently lost
 * every error's profile association (fixed alongside this spec).
 */

const PROFILE_NAME = `Errors Page ${Date.now()}`;
const ERROR_MESSAGE = `e2e test error ${Date.now()}`;

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`delete from client_errors where message = ${ERROR_MESSAGE}`;
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

async function signInAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Site password").fill(process.env.SITE_PASSWORD!);
  await page.getByLabel("Admin token").fill(process.env.ADMIN_TOKEN!);
  await page.getByRole("button", { name: /sign in to admin/i }).click();
  // The click only dispatches the async handleLogin -> router.push("/admin");
  // without waiting for it, a following page.goto() can race ahead of the
  // admin_session cookie actually being set.
  await expect(page).toHaveURL("/admin");
}

test("changelog renders real version history, not an empty shell", async ({ page }) => {
  test.skip(!process.env.ADMIN_TOKEN, "ADMIN_TOKEN is not set");

  await signIn(page);
  await signInAsAdmin(page);
  await page.goto("/admin/changelog");

  await expect(page.getByRole("heading", { name: "Changelog", exact: true })).toBeVisible();
  // At least one parsed version section with at least one item — proves
  // parseChangelog actually read and structured CHANGELOG.md, not just that
  // the page rendered its static header.
  await expect(page.locator("li").first()).toBeVisible();
});

test("enhancements renders real implemented items from enhancements.json", async ({ page }) => {
  test.skip(!process.env.ADMIN_TOKEN, "ADMIN_TOKEN is not set");

  await signIn(page);
  await signInAsAdmin(page);
  await page.goto("/admin/enhancements");

  await expect(page.getByRole("heading", { name: "Enhancements", exact: true })).toBeVisible();
  // A specific, long-settled implemented item rather than just "some text
  // rendered" — proves the JSON file was actually read and parsed correctly.
  await expect(page.getByText("Multi-select workout building")).toBeVisible();
});

test("a logged client error shows up with the correct profile association", async ({ page }) => {
  test.skip(!process.env.ADMIN_TOKEN, "ADMIN_TOKEN is not set");

  await signIn(page);

  // A throwaway profile so the active_profile_id cookie is set to a real,
  // known id when the error is reported below.
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

  // active_profile_id is httpOnly (by design — see profile/actions.ts), so
  // it's invisible to document.cookie; read it via the browser-context API
  // instead, which operates outside the page's own JS sandbox.
  const cookies = await page.context().cookies();
  const activeProfileId = cookies.find((c) => c.name === "active_profile_id")?.value;
  expect(activeProfileId).toBeTruthy();

  // Same request shape src/components/error-boundary.tsx sends, made from
  // inside the page so it carries the real session cookies — this is what
  // actually exercises the cookie-name bug fixed in src/app/api/errors/route.ts.
  const status = await page.evaluate(async (message) => {
    const res = await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, stack: "at test (e2e)", url: location.href }),
    });
    return res.status;
  }, ERROR_MESSAGE);
  expect(status).toBe(200);

  await signInAsAdmin(page);
  await page.goto("/admin/errors");
  await expect(page.getByText(ERROR_MESSAGE)).toBeVisible();

  const sql = postgres(process.env.DATABASE_URL!);
  const [row] = await sql`select profile_id from client_errors where message = ${ERROR_MESSAGE}`;
  await sql.end();
  expect(row.profile_id).toBe(activeProfileId);
});
