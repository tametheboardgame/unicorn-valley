import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

// Accepted current whole-game contracts, independently qualified in ENG-WP1.
// Keep this lean; broader historical regressions live outside this smoke gate.
export default defineConfig({
  ...baseConfig,
  testMatch: [
    '**/eng-wp1.2-current-contract-reproduction.spec.ts',
    '**/r6.5-wp19e-nova-picnic-race-regression.spec.ts',
    '**/r6.5-wp19h4.4a-race-hub-extraction.spec.ts',
    '**/r6.5-wp19h6.3-meadow-gorge.spec.ts',
  ],
  outputDir: 'playtest-smoke-artifacts/results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playtest-smoke-artifacts/html-report', open: 'never' }],
  ],
});
