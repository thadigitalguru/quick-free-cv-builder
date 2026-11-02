import { defineConfig, devices } from '@playwright/test';

// The production build served by `vite preview` (which sends the production security headers),
// in desktop Chrome and in WebKit as an iPhone, the engine behind Safari on iOS.
// E2E_BASE_URL=https://… runs the same suite against a deployment instead.
const deployed = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: deployed ?? 'http://localhost:4317', acceptDownloads: true, trace: 'retain-on-failure' },
  webServer: deployed ? undefined : {
    command: 'npm run build && npx vite preview --port 4317 --strictPort',
    url: 'http://localhost:4317',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    // Locally, the installed Chrome; in CI, Playwright's own Chromium.
    { name: 'chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 }, channel: process.env.CI ? undefined : 'chrome' } },
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
    // The other engines people use: Gecko (Firefox), WebKit on the desktop (Safari), and
    // Chromium on an Android phone. Emulated, so real-device checks are still worth doing.
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1400, height: 900 } } },
    { name: 'safari', use: { ...devices['Desktop Safari'], viewport: { width: 1400, height: 900 } } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
  ],
});
