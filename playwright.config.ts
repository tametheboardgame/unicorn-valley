import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/play',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 6_000,
  },
  outputDir: 'playtest-artifacts/results',
  reporter: [['list'], ['html', { outputFolder: 'playtest-artifacts/html-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
