import { defineConfig, devices } from '@playwright/test';

// The production build served by `vite preview` (which sends the production security headers),
// in desktop Chrome and in WebKit as an iPhone, the engine behind Safari on iOS.
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4317', acceptDownloads: true, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npx vite preview --port 4317 --strictPort',
    url: 'http://localhost:4317',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    // Locally, the installed Chrome; in CI, Playwright's own Chromium.
    { name: 'chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 }, channel: process.env.CI ? undefined : 'chrome' } },
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
  ],
});
