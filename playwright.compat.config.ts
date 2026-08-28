import { defineConfig } from '@playwright/test';

const sharedUse = {
  baseURL: 'http://127.0.0.1:4173',
  screenshot: 'only-on-failure' as const,
  trace: 'retain-on-failure' as const,
};

export default defineConfig({
  testDir: './tests/play',
  testMatch: [
    'r6-wp6.9-browser-deployment.spec.ts',
    'r6-wp6.10-mobile-portrait.spec.ts',
    'r6-wp6.18a-mobile-creator-action.spec.ts',
  ],
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  outputDir: 'browser-compat-artifacts/results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'browser-compat-artifacts/html-report', open: 'never' }],
  ],
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...sharedUse,
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...sharedUse,
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...sharedUse,
        browserName: 'webkit',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'chromium-tablet-touch',
      use: {
        ...sharedUse,
        browserName: 'chromium',
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
      },
    },
    {
      name: 'webkit-tablet-touch',
      use: {
        ...sharedUse,
        browserName: 'webkit',
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
      },
    },
    {
      name: 'chromium-mobile-touch',
      use: {
        ...sharedUse,
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
    },
    {
      name: 'webkit-mobile-touch',
      use: {
        ...sharedUse,
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
