import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.EVIDENCE_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = 'docs/evidence/wp18k-current-head';
const displayClasses = {
  desktop: { viewport: { width: 1440, height: 900 }, hasTouch: false },
  'tablet-landscape': { viewport: { width: 1024, height: 768 }, hasTouch: true },
  'phone-landscape': { viewport: { width: 844, height: 390 }, hasTouch: true },
  'phone-portrait': { viewport: { width: 390, height: 844 }, hasTouch: true },
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
let previousDisplays = {};
if (process.env.EVIDENCE_DISPLAY) {
  try {
    previousDisplays = JSON.parse(await readFile(`${outputDir}/geometry.json`, 'utf8')).displays;
  } catch {
    // A focused first capture starts a new index.
  }
}
const geometry = {
  candidateSha: process.env.CANDIDATE_SHA ?? 'working-tree',
  capturedAt: new Date().toISOString(),
  baseUrl,
  displays: previousDisplays,
};

async function waitForScene(page, sceneKey) {
  await page.waitForFunction((key) => {
    const diagnostics = window.__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(key) === true;
  }, sceneKey);
}

async function capture(page, displayName, surface, sceneKey) {
  await waitForScene(page, sceneKey);
  await page.waitForTimeout(250);
  const canvas = await page.locator('canvas').boundingBox();
  const scene = await page.evaluate((key) => {
    const snapshot = window.__UNICORN_VALLEY_DIAGNOSTICS__.snapshot();
    return snapshot.scenes.find((candidate) => candidate.key === key);
  }, sceneKey);
  geometry.displays[displayName][surface] = {
    viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
    canvas,
    activeScenes: await page.evaluate(
      () => window.__UNICORN_VALLEY_DIAGNOSTICS__.snapshot().activeScenes,
    ),
    namedObjects: Object.fromEntries(
      (scene?.objects ?? [])
        .filter(({ name, visible }) => name && visible)
        .map(({ name, x, y, displayWidth, displayHeight, interactive }) => [
          name,
          { x, y, displayWidth, displayHeight, interactive },
        ]),
    ),
  };
  await page.screenshot({ path: `${outputDir}/${displayName}-${surface}.png` });
}

try {
  for (const [displayName, options] of Object.entries(displayClasses)) {
    if (process.env.EVIDENCE_DISPLAY && process.env.EVIDENCE_DISPLAY !== displayName) continue;
    const context = await browser.newContext(options);
    const page = await context.newPage();
    geometry.displays[displayName] = {};

    await page.goto(`${baseUrl}/?scene=glade&diagnostics=1`);
    await capture(page, displayName, 'hud', 'ExplorationHudOverlayScene');

    const overlay = await page.evaluate(() =>
      window.__UNICORN_VALLEY_DIAGNOSTICS__
        .snapshot()
        .scenes.find(({ key }) => key === 'ExplorationHudOverlayScene'),
    );
    const settings = overlay?.objects.find(
      ({ name, visible, interactive }) =>
        name === 'exploration-hud-overlay-settings-nav-button' && visible && interactive,
    );
    if (!settings) {
      await page.getByRole('button', { name: 'Settings' }).click();
      await capture(page, displayName, 'settings', 'SettingsScene');
    } else {
      const canvas = await page.locator('canvas').boundingBox();
      if (!canvas) throw new Error(`Canvas unavailable for ${displayName}`);
      await page.mouse.click(
        canvas.x + (settings.x / 1280) * canvas.width,
        canvas.y + (settings.y / 720) * canvas.height,
      );
      await capture(page, displayName, 'settings', 'SettingsScene');
    }

    await page.goto(`${baseUrl}/?diagnostics=1`);
    await waitForScene(page, 'TitleScene');
    await page.evaluate(() => window.__UNICORN_VALLEY_DIAGNOSTICS__.startScene('InventoryScene'));
    await capture(page, displayName, 'bag', 'InventoryScene');
    await page.goto(`${baseUrl}/?diagnostics=1`);
    await waitForScene(page, 'TitleScene');
    await page.evaluate(() => window.__UNICORN_VALLEY_DIAGNOSTICS__.startScene('WonderbookScene'));
    await capture(page, displayName, 'book', 'WonderbookScene');
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(`${outputDir}/geometry.json`, `${JSON.stringify(geometry, null, 2)}\n`);
