import { defineConfig, devices } from "@playwright/test";

/** Osobny port — żeby nie łączyć się z innym projektem na :3000. */
const E2E_PORT = 3005;
const E2E_ORIGIN = `http://127.0.0.1:${E2E_PORT}`;

/**
 * Zdalny smoke test produkcji / staging:
 *   PLAYWRIGHT_BASE_URL=https://twoja-domena.pl npm run test:e2e:remote
 * (nie startuje `next start` lokalnie)
 */
const remoteBase = process.env.PLAYWRIGHT_BASE_URL?.trim();
const useRemote = !!remoteBase && /^https?:\/\//i.test(remoteBase);

/**
 * Testy E2E (smoke): lokalnie — build + `next start` na porcie 3005.
 * Pierwszy raz: `npx playwright install chromium`
 * Pełna weryfikacja: `npm run verify`
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: useRemote ? remoteBase : E2E_ORIGIN,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(!useRemote
    ? {
        webServer: {
          command: `PORT=${E2E_PORT} npm run start`,
          url: E2E_ORIGIN,
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }
    : {}),
});
