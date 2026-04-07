import { defineConfig, devices } from "@playwright/test";

/** Osobny port — żeby nie łączyć się z innym projektem na :3000. */
const E2E_PORT = 3005;
const E2E_ORIGIN = `http://127.0.0.1:${E2E_PORT}`;

/**
 * Testy E2E (smoke): uruchamiają się przeciwko serwerowi Next.
 * Pierwszy raz: `npx playwright install chromium`
 * Samo E2E: `npm run test:e2e` — build + `next start` na porcie 3005 (nie używa drugiego `next dev`).
 * Pełna weryfikacja: `npm run verify` (eslint + vitest + build + e2e).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: E2E_ORIGIN,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Tylko `next start` — drugi `next dev` w tym samym folderze jest blokowany przez Next 16.
  webServer: {
    command: `PORT=${E2E_PORT} npm run start`,
    url: E2E_ORIGIN,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
