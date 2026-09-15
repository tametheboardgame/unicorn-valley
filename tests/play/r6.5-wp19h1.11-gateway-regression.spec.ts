import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  visible: boolean;
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
}

interface DiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
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

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await expect
    .poll(async () => (await snapshot(page)).activeScenes.includes(sceneKey), { timeout: 8_000 })
    .toBe(true);
}

async function setPlayerPosition(
  page: Page,
  sceneKey: string,
  x: number,
  y: number,
): Promise<void> {
  await page.evaluate(
    ({ key, playerName, targetX, targetY }) => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.setArcadeSpritePosition(key, playerName, targetX, targetY);
    },
    { key: sceneKey, playerName: PLAYER_NAME, targetX: x, targetY: y },
  );
}

async function playerPosition(page: Page, sceneKey: string): Promise<{ x: number; y: number }> {
  const scene = (await snapshot(page)).scenes.find((candidate) => candidate.key === sceneKey);
  const player = scene?.objects.find((object) => object.name === PLAYER_NAME && object.visible);
  if (!player) {
    throw new Error(`Missing visible player in ${sceneKey}.`);
  }
  return { x: player.x, y: player.y };
}

test('Moonflower Glade and Sunbeam Village gateways cross automatically without bouncing back', async ({
  page,
}) => {
  await seedIntroducedPip(page);
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  await setPlayerPosition(page, 'MoonflowerGladeScene', 2680, 900);
  await waitForScene(page, 'SunbeamVillageScene');

  let position = await playerPosition(page, 'SunbeamVillageScene');
  expect(position.x).toBeCloseTo(330, 0);
  expect(position.y).toBeCloseTo(950, 0);
  await page.waitForTimeout(450);
  expect((await snapshot(page)).activeScenes).toContain('SunbeamVillageScene');

  await setPlayerPosition(page, 'SunbeamVillageScene', 120, 950);
  await waitForScene(page, 'MoonflowerGladeScene');

  position = await playerPosition(page, 'MoonflowerGladeScene');
  expect(position.x).toBeCloseTo(2470, 0);
  expect(position.y).toBeCloseTo(900, 0);
  await page.waitForTimeout(450);
  expect((await snapshot(page)).activeScenes).toContain('MoonflowerGladeScene');
});
