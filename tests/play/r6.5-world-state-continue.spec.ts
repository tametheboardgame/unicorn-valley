import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';

interface DiagnosticObject {
  text: string | null;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
}

interface DiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
}

function createStoredSave(locationId: string): Record<string, unknown> {
  const timestamp = '2026-09-03T15:00:00.000Z';
  return {
    schemaVersion: 2,
    createdAt: timestamp,
    lastSavedAt: timestamp,
    profile: {
      name: 'Starlight',
      appearance: { bodyColour: 'mint' },
      currentLocationId: locationId,
      unlockedAbilityIds: ['ability:rainbow-jump'],
    },
    inventory: {
      itemQuantities: { 'currency:shimmer': 18 },
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
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
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
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function tapTitleContinue(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
    };
    const title = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'TitleScene');
    return title?.objects.some(
      (object) => object.visible && object.interactive && object.text === 'Continue',
    );
  });

  const state = await snapshot(page);
  const title = state.scenes.find((scene) => scene.key === 'TitleScene');
  const target = title?.objects.find(
    (object) => object.visible && object.interactive && object.text === 'Continue',
  );
  const bounds = await page.locator('canvas').boundingBox();
  if (!target || !bounds) {
    throw new Error('Continue button is not available.');
  }
  await page.mouse.click(
    bounds.x + (target.x / state.width) * bounds.width,
    bounds.y + (target.y / state.height) * bounds.height,
  );
}

for (const [locationId, expectedScene] of [
  ['location:crystal-brook', 'CrystalBrookScene'],
  ['location:whispering-woods', 'WhisperingWoodsScene'],
  ['location:starlight-beach', 'StarlightBeachScene'],
] as const) {
  test(`Continue restores ${locationId} to ${expectedScene}`, async ({ page }) => {
    const save = createStoredSave(locationId);
    await page.addInitScript(
      ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
      { key: SAVE_KEY, value: save },
    );

    await page.goto('/?diagnostics=1');
    await waitForScene(page, 'TitleScene');
    await tapTitleContinue(page);
    await waitForScene(page, expectedScene);

    const storedLocation = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) ?? '{}').profile?.currentLocationId,
      SAVE_KEY,
    );
    expect(storedLocation).toBe(locationId);
  });
}
