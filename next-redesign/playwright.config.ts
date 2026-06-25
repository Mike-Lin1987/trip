import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3200);
const baseURL = `http://127.0.0.1:${port}`;
const testTravelPassword = "playwright-trip-password";
const testTravelPasswordHash =
  "63004a09f1ab57bfa63dae85236ced8dba11d8697cdfbdd2bb43ba4175ba1253";
const testTravelSessionSecret =
  "playwright-travel-session-secret-32-chars";
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL as
  | "chrome"
  | "msedge"
  | undefined;
const channelUse = browserChannel ? { channel: browserChannel } : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm.cmd run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      TRAVEL_PASSWORD_HASH: testTravelPasswordHash,
      TRAVEL_SESSION_SECRET: testTravelSessionSecret,
      TRAVEL_TEST_PASSWORD: testTravelPassword,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...channelUse },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], ...channelUse },
    },
  ],
});
