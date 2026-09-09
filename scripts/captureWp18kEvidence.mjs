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
  const domCompanions = await page.locator('[data-mobile-modal-companion]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        id: node.getAttribute('data-mobile-modal-companion'),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        actions: [...node.querySelectorAll('button')].map((button) => {
          const actionRect = button.getBoundingClientRect();
          return {
            id: button.getAttribute('data-mobile-modal-action'),
            label: button.textContent,
            rect: {
              x: actionRect.x,
              y: actionRect.y,
              width: actionRect.width,
              height: actionRect.height,
            },
          };
        }),
      };
    }),
  );
  const scaleX = canvas ? canvas.width / 1280 : 0;
  const scaleY = canvas ? canvas.height / 720 : 0;
  geometry.displays[displayName][surface] = {
    viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
    canvas,
    logicalToCssScale: { x: scaleX, y: scaleY },
    domCompanions,
    activeScenes: await page.evaluate(
      () => window.__UNICORN_VALLEY_DIAGNOSTICS__.snapshot().activeScenes,
    ),
    namedObjects: Object.fromEntries(
      (scene?.objects ?? [])
        .filter(({ name, visible }) => name && visible)
        .map(({ name, x, y, displayWidth, displayHeight, interactive }) => [
          name,
          {
            logical: { x, y, width: displayWidth, height: displayHeight },
            css: canvas
              ? {
                  x: canvas.x + (x - displayWidth / 2) * scaleX,
                  y: canvas.y + (y - displayHeight / 2) * scaleY,
                  width: displayWidth * scaleX,
                  height: displayHeight * scaleY,
                }
              : null,
            interactive,
          },
        ]),
    ),
  };
  await page.screenshot({ path: `${outputDir}/${displayName}-${surface}.png` });
}

async function openHudModal(page, buttonName, sceneKey) {
  await page.goto(`${baseUrl}/?scene=glade&diagnostics=1`);
  await waitForScene(page, 'ExplorationHudOverlayScene');
  const button = await page.evaluate(
    (name) =>
      window.__UNICORN_VALLEY_DIAGNOSTICS__
        .snapshot()
        .scenes.find(({ key }) => key === 'ExplorationHudOverlayScene')
        ?.objects.find((object) => object.name === name && object.visible && object.interactive),
    buttonName,
  );
  if (!button) {
    const accessibleName = {
      'exploration-hud-overlay-settings-nav-button': 'Settings',
      'exploration-hud-overlay-bag-button': 'Bag',
      'exploration-hud-overlay-map-button': 'Map',
      'exploration-hud-overlay-book-button': 'Book',
    }[buttonName];
    if (!accessibleName) throw new Error(`Missing HUD modal entry ${buttonName}`);
    await page.getByRole('button', { name: accessibleName, exact: true }).click();
    await waitForScene(page, sceneKey);
    return;
  }
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Canvas unavailable');
  await page.mouse.click(
    canvas.x + (button.x / 1280) * canvas.width,
    canvas.y + (button.y / 720) * canvas.height,
  );
  await waitForScene(page, sceneKey);
}

try {
  for (const [displayName, options] of Object.entries(displayClasses)) {
    if (process.env.EVIDENCE_DISPLAY && process.env.EVIDENCE_DISPLAY !== displayName) continue;
    const context = await browser.newContext(options);
    const page = await context.newPage();
    geometry.displays[displayName] = {};

    await page.goto(`${baseUrl}/?scene=glade&diagnostics=1`);
    await capture(page, displayName, 'hud', 'ExplorationHudOverlayScene');

    await openHudModal(page, 'exploration-hud-overlay-settings-nav-button', 'SettingsScene');
    await capture(page, displayName, 'settings', 'SettingsScene');
    await page.mouse.wheel(0, 520);
    await capture(page, displayName, 'settings-scrolled', 'SettingsScene');

    await openHudModal(page, 'exploration-hud-overlay-bag-button', 'InventoryScene');
    await capture(page, displayName, 'bag-empty', 'InventoryScene');
    await page.evaluate(() => {
      const key = 'unicorn-valley.save';
      const timestamp = '2026-09-09T00:00:00.000Z';
      const save = JSON.parse(localStorage.getItem(key) ?? 'null') ?? {
        schemaVersion: 2,
        createdAt: timestamp,
        lastSavedAt: timestamp,
        profile: {
          name: 'Evidence',
          appearance: {},
          currentLocationId: 'location:moonflower-glade',
          unlockedAbilityIds: [],
        },
        inventory: {
          itemQuantities: {},
          ownedCosmeticIds: [],
          ownedDecorationIds: [],
          specialItemIds: [],
        },
        relationships: { byCharacterId: {} },
        quests: { byQuestId: {} },
        world: { flags: {}, discoveredZoneIds: [], changedObjectIds: [], uniqueDiscoveryIds: [] },
        home: { ownedFurnitureIds: [], furnitureBySlot: {}, gardenFlags: {} },
        activities: { racesById: {}, miniGameRecords: {} },
        collections: { discoveryIds: [], memoryIds: [] },
      };
      save.inventory.itemQuantities = {
        ...save.inventory.itemQuantities,
        'item:berry-bun': 2,
        'item:willow-moonflower': 1,
        'item:sunbeam-cushion': 1,
      };
      localStorage.setItem(key, JSON.stringify(save));
    });
    await openHudModal(page, 'exploration-hud-overlay-bag-button', 'InventoryScene');
    await capture(page, displayName, 'bag-populated', 'InventoryScene');

    await openHudModal(page, 'exploration-hud-overlay-map-button', 'InventoryScene');
    await capture(page, displayName, 'map-before-drag', 'InventoryScene');
    const mapCanvas = await page.locator('canvas').boundingBox();
    if (!mapCanvas) throw new Error(`Canvas unavailable for ${displayName} map drag`);
    const mapPoint = (x, y) => ({
      x: mapCanvas.x + (x / 1280) * mapCanvas.width,
      y: mapCanvas.y + (y / 720) * mapCanvas.height,
    });
    await page.mouse.move(mapPoint(900, 410).x, mapPoint(900, 410).y);
    await page.mouse.down();
    await page.mouse.move(mapPoint(770, 340).x, mapPoint(770, 340).y, { steps: 8 });
    await page.mouse.up();
    await capture(page, displayName, 'map-after-drag', 'InventoryScene');

    await openHudModal(page, 'exploration-hud-overlay-book-button', 'WonderbookScene');
    await capture(page, displayName, 'book', 'WonderbookScene');
    const bookCompanion = page.locator('[data-mobile-modal-companion="wonderbook"]');
    if (await bookCompanion.count()) {
      await bookCompanion.evaluate((node) => node.scrollTo(0, node.scrollHeight));
      await capture(page, displayName, 'book-controls', 'WonderbookScene');
    }
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(`${outputDir}/geometry.json`, `${JSON.stringify(geometry, null, 2)}\n`);
