import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  interactive: boolean;
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
  setArcadeSpritePosition(
    sceneKey: string,
    objectName: string,
    x: number,
    y: number,
  ): void;
}

async function seedFollowUpPrerequisites(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = '2026-09-04T14:00:00.000Z';
    localStorage.setItem(
      'unicorn-valley.save',
      JSON.stringify({
        schemaVersion: 2,
        createdAt: timestamp,
        lastSavedAt: timestamp,
        profile: {
          name: 'Star',
          appearance: {},
          currentLocationId: 'location:whispering-woods',
          unlockedAbilityIds: [],
        },
        inventory: {
          itemQuantities: {},
          ownedCosmeticIds: [],
          ownedDecorationIds: [],
          specialItemIds: [],
        },
        relationships: {
          byCharacterId: {
            'character:lumi': {
              friendshipPoints: 8,
              flags: ['r5:lumi-intro-complete'],
            },
          },
        },
        quests: {
          byQuestId: {
            'quest:coral-shells-with-stories': {
              status: 'completed',
              currentStepId: null,
              completedAt: timestamp,
            },
          },
        },
        world: {
          flags: {
            'flag:r5-woods-starwell-revealed': true,
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

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are not installed.');
    }
    diagnostics.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
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

async function interactAt(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await movePlayer(page, sceneKey, x, y);
  await page.waitForTimeout(120);
  await page.keyboard.press('e');
  await page.waitForTimeout(180);
}

test('WP13 follows Coral from Beach to Lumi in the Woods and leaves a lasting Beach change', async ({
  page,
}) => {
  await seedFollowUpPrerequisites(page);
  await waitForDiagnostics(page);

  await startScene(page, 'WhisperingWoodsScene');
  await movePlayer(page, 'WhisperingWoodsScene', 3180, 1690);
  await waitForScene(page, 'StarlightBeachScene');

  await waitForObject(page, 'StarlightBeachScene', 'wp13-story:moonlit-shell-glimmer');
  await interactAt(page, 'StarlightBeachScene', 2860, 1800);
  await waitForObject(page, 'StarlightBeachScene', 'wp13-story:ask-coral-about-glimmer');
  await interactAt(page, 'StarlightBeachScene', 1110, 1050);

  await startScene(page, 'WhisperingWoodsScene');
  await waitForObject(page, 'WhisperingWoodsScene', 'wp13-story:ask-lumi-about-glimmer');
  await interactAt(page, 'WhisperingWoodsScene', 2735, 1510);
  await waitForObject(page, 'WhisperingWoodsScene', 'wp13-story:starwell-sea-reflection');
  await interactAt(page, 'WhisperingWoodsScene', 2920, 1700);

  await startScene(page, 'StarlightBeachScene');
  await waitForObject(
    page,
    'StarlightBeachScene',
    'wp13-story:return-to-coral-with-starwell-answer',
  );
  await interactAt(page, 'StarlightBeachScene', 1110, 1050);
  await waitForObject(
    page,
    'StarlightBeachScene',
    'wp13-persistent:shore-starwell-lantern',
  );

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}'),
  );
  expect(saved.quests.byQuestId['quest:lumi-coral-light-found-sea'].status).toBe('completed');
  expect(saved.world.flags['flag:r65-wp13-light-found-sea-complete']).toBe(true);
  expect(saved.inventory.itemQuantities['item:shore-and-starwell-lantern']).toBe(1);
});
