import { expect, type Page, test } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  type: string;
  name: string;
  text: string | null;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  interactive: boolean;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

async function getSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function logicalClick(page: Page, logicalX: number, logicalY: number): Promise<void> {
  const snapshot = await getSnapshot(page);
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (logicalX / snapshot.width) * bounds.width,
    bounds.y + (logicalY / snapshot.height) * bounds.height,
  );
}

function sceneSnapshot(
  snapshot: BrowserDiagnosticSnapshot,
  sceneKey: string,
): DiagnosticSceneSnapshot {
  const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

function playerObject(scene: DiagnosticSceneSnapshot): DiagnosticObjectSnapshot {
  const player = scene.objects.find(
    (object) =>
      object.name === 'world-player-unicorn' ||
      object.textureKey?.startsWith('player-unicorn-rainbow-meadow'),
  );
  if (!player) {
    throw new Error('Missing world player diagnostic object.');
  }
  return player;
}

async function seedIntroducedPip(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    const timestamp = new Date().toISOString();
    const save = {
      schemaVersion: 2,
      createdAt: timestamp,
      lastSavedAt: timestamp,
      profile: {
        name: null,
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
      world: {
        flags: {
          'flag:pip-intro-appeared': true,
          'flag:pip-welcome-complete': true,
        },
        discoveredZoneIds: [],
        changedObjectIds: [],
        uniqueDiscoveryIds: [],
      },
      home: {
        ownedFurnitureIds: [],
        furnitureBySlot: {},
        gardenFlags: {},
      },
      activities: {
        racesById: {},
        miniGameRecords: {},
      },
      collections: {
        discoveryIds: [],
        memoryIds: [],
      },
    };
    const serialised = JSON.stringify(save);
    localStorage.setItem('unicorn-valley.save', serialised);
    localStorage.setItem('unicorn-valley.save.schema.2', serialised);
  });
}

test('exploration chrome uses the canonical static HUD and a centred canvas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  if (!canvas) {
    return;
  }
  const leftGutter = canvas.x;
  const rightGutter = 1440 - (canvas.x + canvas.width);
  expect(Math.abs(leftGutter - rightGutter)).toBeLessThanOrEqual(2);

  const snapshot = await getSnapshot(page);
  const glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some(
      (object) =>
        object.name === 'exploration-location-title' &&
        object.text === 'Moonflower Glade' &&
        object.visible,
    ),
  ).toBe(true);
  expect(glade.objects.some((object) => object.name === 'exploration-controls-button')).toBe(false);
  expect(
    glade.objects.some((object) => object.visible && object.text?.startsWith('Pip is nearby.')),
  ).toBe(false);
  expect(glade.objects.some((object) => object.name === 'activity-suggestion-card')).toBe(false);
  expect(snapshot.activeScenes).toContain('ExplorationHudOverlayScene');
});

test('clicking open ground moves the unicorn again', async ({ page }) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  const snapshot = await getSnapshot(page);
  const glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  const before = playerObject(glade);

  await logicalClick(page, 900, 360);
  await expect
    .poll(
      async () => {
        const current = await getSnapshot(page);
        const player = playerObject(sceneSnapshot(current, 'MoonflowerGladeScene'));
        return player.x - before.x;
      },
      { timeout: 5_000 },
    )
    .toBeGreaterThan(60);
});

test('held movement carries through an automatic world transition on the first pass', async ({
  page,
}) => {
  // The first-run Pip welcome correctly pauses world movement. This contract isolates held-input
  // hand-off across the gateway by starting from the post-welcome exploration state.
  await seedIntroducedPip(page);
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  await page.keyboard.down('ArrowRight');
  await waitForScene(page, 'SunbeamVillageScene');

  let snapshot = await getSnapshot(page);
  let village = sceneSnapshot(snapshot, 'SunbeamVillageScene');
  const arrived = playerObject(village);
  await page.waitForTimeout(300);
  snapshot = await getSnapshot(page);
  village = sceneSnapshot(snapshot, 'SunbeamVillageScene');
  const stillHeld = playerObject(village);
  expect(stillHeld.x - arrived.x).toBeGreaterThan(20);

  await page.keyboard.up('ArrowRight');
});
