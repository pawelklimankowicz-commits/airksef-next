import { expect, test } from "@playwright/test";

test.describe("AIRKSEF — smoke (aplikacja odpowiada)", () => {
  test("strona główna: tytuł i hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AIRKSEF/i);
    await expect(
      page.getByRole("heading", { level: 1, name: /Faktury zagraniczne/i })
    ).toBeVisible();
    await expect(page.getByText(/Uber.*Airbnb/i).first()).toBeVisible();
  });

  test("generator: kreator XML", async ({ page }) => {
    await page.goto("/generator");
    await expect(
      page.getByRole("heading", { name: /Generator XML FA \(3\)/i })
    ).toBeVisible();
    await expect(page.getByText("Platforma")).toBeVisible();
  });

  test("regulamin: strona prawna", async ({ page }) => {
    await page.goto("/regulamin");
    await expect(page.getByRole("heading", { name: /regulamin/i })).toBeVisible();
  });

  test("setup: strona konfiguracji (bez crasha)", async ({ page }) => {
    await page.goto("/setup");
    await expect(
      page.getByRole("heading", { name: /Konfiguracja środowiska/i })
    ).toBeVisible();
  });

  test("faktury: layout chroniony lub redirect — brak 5xx", async ({ page }) => {
    const res = await page.goto("/faktury");
    expect(res?.status()).toBeLessThan(500);
  });
});
