import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

interface SavedActivityState {
  inventory: {
    itemQuantities: Record<string, number>;
  };
  activities: {
    miniGameRecords: Record<string, number>;
  };
  collections: {
    discoveryIds: string[];
    memoryIds: string[];
  };
}

async function seedActivityPrerequisites(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = '2026-09-04T20:30:00.000Z';
    localStorage.setItem(
      'unicorn-valley.save',
      JSON.stringify({
        schemaVersion: 2,
        createdAt: timestamp,
        lastSavedAt: timestamp,
        profile: {
          name: 'Star',
          appearance: {},
          currentLocationId: 'location:sunbeam-village',
          unlockedAbilityIds: [],
        },
        inventory: {
          itemQuantities: {},
          ownedCosmeticIds: [],
          ownedDecorationIds: [],
          specialItemIds: [],
        },
        relationships: { byCharacterId: {} },
        quests: {
          byQuestId: {
            'quest:maple-wobbly-cake-plan': {
              status: 'completed',
              currentStepId: null,
              completedAt: timestamp,
            },
            'quest:coral-shells-with-stories': {
              status: 'completed',
              currentStepId: null,
              completedAt: timestamp,
            },
          },
        },
        world: {
          flags: {
            'flag:beachcombing-ready': true,
            'flag:coral-shell-stories-complete': true,
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
          memoryIds: [
            'memory:economy-reward:completed:quest:maple-wobbly-cake-plan',
            'memory:economy-reward:completed:quest:coral-shells-with-stories',
          ],
        },
      }),
    );
  });
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(key) ?? false;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are not installed.');
      }
      diagnostics.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
  await waitForScene(page, sceneKey);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ key, name }) => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = diagnostics?.snapshot().scenes.find((candidate) => candidate.key === key);
      return scene?.objects.some((object) => object.name === name && object.visible) ?? false;
    },
    { key: sceneKey, name: objectName },
  );
}

async function movePlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, nextX, nextY }) => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are not installed.');
      }
      diagnostics.setArcadeSpritePosition(key, 'world-player-unicorn', nextX, nextY);
    },
    { key: sceneKey, nextX: x, nextY: y },
  );
}

async function readSave(page: Page): Promise<SavedActivityState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}'));
}

test('WP14 Maple baking is a three-choice replayable activity with finite rewards', async ({
  page,
}) => {
  await seedActivityPrerequisites(page);
  await waitForDiagnostics(page);
  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'bakery',
    returnScene: 'SunbeamVillageScene',
  });

  await waitForObject(page, 'VillageInteriorScene', 'wp14-activity-entry:maple-baking');
  const canvas = page.locator('canvas');
  await canvas.click({ position: { x: 1010, y: 548 } });
  await waitForScene(page, 'MapleBakingActivityScene');
  await waitForObject(page, 'MapleBakingActivityScene', 'wp14-baking-stage:theme');

  await canvas.click({ position: { x: 360, y: 340 } });
  await waitForObject(page, 'MapleBakingActivityScene', 'wp14-baking-stage:topping');
  await canvas.click({ position: { x: 640, y: 340 } });
  await waitForObject(page, 'MapleBakingActivityScene', 'wp14-baking-stage:finish');
  await canvas.click({ position: { x: 920, y: 340 } });
  await waitForObject(page, 'MapleBakingActivityScene', 'wp14-baking-result');

  let saved = await readSave(page);
  expect(saved.activities.miniGameRecords['minigame:maple-baking-table']).toBe(1);
  expect(saved.collections.discoveryIds).toContain('discovery:sunshine-sprinkle-cake');
  expect(saved.collections.memoryIds).toContain('memory:r65-wp14-maple-baking-first-completion');
  expect(saved.inventory.itemQuantities['item:rainbow-run-sparkle']).toBe(2);

  await canvas.click({ position: { x: 500, y: 465 } });
  await canvas.click({ position: { x: 360, y: 340 } });
  await canvas.click({ position: { x: 360, y: 340 } });
  await canvas.click({ position: { x: 360, y: 340 } });
  await waitForObject(page, 'MapleBakingActivityScene', 'wp14-baking-result');

  saved = await readSave(page);
  expect(saved.activities.miniGameRecords['minigame:maple-baking-table']).toBe(1);
  expect(saved.inventory.itemQuantities['item:rainbow-run-sparkle']).toBe(2);

  await canvas.click({ position: { x: 780, y: 465 } });
  await waitForScene(page, 'VillageInteriorScene');
});

test('WP14 Coral beachcombing records a notebook page and returns safely to the Beach', async ({
  page,
}) => {
  await seedActivityPrerequisites(page);
  await waitForDiagnostics(page);

  await startScene(page, 'WhisperingWoodsScene');
  await movePlayer(page, 'WhisperingWoodsScene', 3180, 1690);
  await waitForScene(page, 'StarlightBeachScene');
  await waitForObject(page, 'StarlightBeachScene', 'wp14-activity-entry:coral-beachcombing');

  await movePlayer(page, 'StarlightBeachScene', 1210, 1490);
  await page.waitForTimeout(120);
  await page.keyboard.press('e');
  await waitForScene(page, 'CoralBeachcombingActivityScene');
  await waitForObject(
    page,
    'CoralBeachcombingActivityScene',
    'wp14-beachcombing-trail:crab-tracks',
  );

  const canvas = page.locator('canvas');
  for (const x of [220, 430, 640, 850]) {
    await canvas.click({ position: { x, y: 330 } });
  }
  await waitForObject(page, 'CoralBeachcombingActivityScene', 'wp14-beachcombing-result');

  const saved = await readSave(page);
  expect(saved.activities.miniGameRecords['minigame:coral-beachcombing']).toBe(1);
  expect(saved.collections.discoveryIds).toContain('discovery:crab-track-notebook-page');
  expect(saved.collections.memoryIds).toContain(
    'memory:r65-wp14-coral-beachcombing-first-completion',
  );
  expect(saved.inventory.itemQuantities['item:rainbow-run-sparkle']).toBe(2);

  await canvas.click({ position: { x: 780, y: 465 } });
  await waitForScene(page, 'StarlightBeachScene');
  await waitForObject(page, 'StarlightBeachScene', 'wp14-activity-entry:coral-beachcombing');
});
