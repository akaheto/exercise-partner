import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Regression cover for PIN salting and attempt limiting (src/lib/pin.ts).
 *
 * Two profiles created with the identical PIN previously produced identical
 * pin_hash values, because every profile shared one hardcoded salt — anyone
 * with database read access could see which profiles used the same PIN, and
 * one precomputed table covered the whole 4-6 digit keyspace for every
 * profile at once. There was also no attempt limiting: a 4-digit PIN was
 * exhaustible in 10,000 unthrottled requests.
 *
 * Creates its own throwaway profiles and deletes them directly via SQL in
 * afterAll — not through the app's own PIN-gated deletion, since one of them
 * is deliberately left locked out by the test itself.
 */

const SAME_PIN = "1234";
const NAME_A = `PinSec A ${Date.now()}`;
const NAME_B = `PinSec B ${Date.now()}`;

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`delete from profiles where display_name in (${NAME_A}, ${NAME_B})`;
  const left = await sql`
    select count(*)::int as n from profiles where display_name in (${NAME_A}, ${NAME_B})
  `;
  await sql.end();
  if (left[0].n !== 0) throw new Error("cleanup failed — throwaway profiles still present");
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Password").fill(process.env.SITE_PASSWORD!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");
}

// /profile's own "Add a profile" card, not the home page's — the home page
// now correctly redirects an active-but-incomplete profile straight back to
// /onboarding (the onboarding fix), so it can't be reused to create a SECOND
// profile once the first one is active. /profile always renders the add-form
// regardless of onboarding state.
async function createProfile(page: Page, name: string, pin: string) {
  await page.goto("/profile");
  await expect(page.getByLabel("Name")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("PIN").fill(pin);
  await page.getByRole("button", { name: "Add" }).click();
  // Real ground truth: the profile shows up in the "All profiles" <ul> once
  // the server action has committed and revalidated the page. Scoped to that
  // list specifically — the top bar's profile-switcher trigger also shows
  // the active profile's name and would otherwise ambiguously match too.
  await expect(page.locator("ul").getByRole("button", { name })).toBeVisible({
    timeout: 10_000,
  });
}

test("two profiles with the identical PIN get different hashes in the database", async ({
  page,
}) => {
  await signIn(page);
  await createProfile(page, NAME_A, SAME_PIN);
  await createProfile(page, NAME_B, SAME_PIN);

  const sql = postgres(process.env.DATABASE_URL!);
  const rows = await sql`
    select display_name, pin_hash, pin_salt from profiles
    where display_name in (${NAME_A}, ${NAME_B})
    order by display_name
  `;
  await sql.end();

  expect(rows).toHaveLength(2);
  const [a, b] = rows;
  expect(a.pin_salt).not.toBeNull();
  expect(b.pin_salt).not.toBeNull();
  // The actual security property: same PIN, different salt, different hash.
  expect(a.pin_salt).not.toBe(b.pin_salt);
  expect(a.pin_hash).not.toBe(b.pin_hash);
});

test("five wrong PIN guesses lock the profile out, even from a correct guess", async ({
  page,
}) => {
  await signIn(page);

  // Profile B was left active by the previous test (creating a profile makes
  // it active). Switch back to A via the "All profiles" list if needed — its
  // switcher button is disabled while A is already active, so this is a
  // no-op in that case rather than an error.
  await page.goto("/profile");
  const switchToA = page.locator("ul").getByRole("button", { name: NAME_A });
  if (await switchToA.isEnabled()) {
    await switchToA.click();
    await page.waitForLoadState("networkidle");
  }

  await page.getByRole("button", { name: /delete this profile/i }).click();
  const pinField = page.getByLabel(/enter your pin/i);
  const confirmButton = page.getByRole("button", { name: "Delete profile" });

  for (let attempt = 1; attempt <= 4; attempt++) {
    await pinField.fill("0000");
    await confirmButton.click();
    await expect(page.getByText("Incorrect PIN")).toBeVisible();
  }

  // Fifth wrong guess crosses MAX_PIN_ATTEMPTS and should lock immediately.
  await pinField.fill("0000");
  await confirmButton.click();
  await expect(page.getByText(/too many incorrect attempts/i)).toBeVisible();

  // A sixth attempt with the CORRECT PIN must still be refused — the lock
  // itself is checked before the guess is even hashed, so being right no
  // longer matters once locked out.
  await pinField.fill(SAME_PIN);
  await confirmButton.click();
  await expect(page.getByText(/too many incorrect attempts/i)).toBeVisible();

  const sql = postgres(process.env.DATABASE_URL!);
  const [row] = await sql`
    select pin_failed_attempts, pin_locked_until from profiles where display_name = ${NAME_A}
  `;
  await sql.end();
  expect(row.pin_failed_attempts).toBeGreaterThanOrEqual(5);
  expect(row.pin_locked_until).not.toBeNull();
  expect(new Date(row.pin_locked_until).getTime()).toBeGreaterThan(Date.now());
});
