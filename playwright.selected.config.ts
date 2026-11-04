import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

// Used only by the CI ownership-selected Tier 2 runner. Playwright test-level
// isolation allows one large Crystalarium spec to spread across workers.
// The authoritative full Chromium static-six and compatibility configs are
// deliberately unchanged; do not increase workers there by implication.
export default defineConfig(baseConfig, {
  fullyParallel: true,
  workers: 3,
});
