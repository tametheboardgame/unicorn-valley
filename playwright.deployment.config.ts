import { defineConfig } from '@playwright/test';

const deploymentUrl = process.env.DEPLOYMENT_URL;
if (!deploymentUrl) {
  throw new Error('DEPLOYMENT_URL is required for deployed qualification.');
}

export default defineConfig({
  testDir: './tests/deployment',
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  outputDir: 'deployment-smoke-artifacts/results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'deployment-smoke-artifacts/report', open: 'never' }],
  ],
  use: {
    baseURL: deploymentUrl,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
