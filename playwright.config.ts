import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled' } },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  snapshotPathTemplate: '{testDir}/screenshots/chromium-linux/{testFilePath}/{arg}{ext}',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    reducedMotion: 'reduce',
    baseURL: 'http://127.0.0.1:4192',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block'
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node scripts/run-e2e-app.mjs',
    url: 'http://127.0.0.1:4192',
    reuseExistingServer: false,
    timeout: 120_000
  }
});
