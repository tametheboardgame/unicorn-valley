import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  openDiagnostics,
  setArcadeSpritePosition,
  startScene,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

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

async function seedActivityPrerequisites(page: Page, initialShimmer = 0): Promise<void> {
  await page.addInitScript((seedShimmer) => {
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
          itemQuantities:
            seedShimmer > 0
              ? { 'item:rainbow-run-sparkle': seedShimmer }
              : {},
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
  }, initialShimmer);
}

async function readSave(page: Page): Promise<SavedActivityState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}'));
}

async function holdMeasure(page: Page, objectName: string, milliseconds: number): Promise<void> {
  await waitForNamedObject(page, 'MapleBakingActivityScene', objectName);
  await page.keyboard.down('Space');
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up('Space');
}

test('WP14 Maple baking reuses the cake table and rewards a strong repeat bake', async ({
  page,
}) => {
  await seedActivityPrerequisites(page, 2);
  await openDiagnostics(page);
  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'bakery',
    returnScene: 'SunbeamVillageScene',
  });
  const startingBalance =
    (await readSave(page)).inventory.itemQuantities['item:rainbow-run-sparkle'] ?? 0;

  await setArcadeSpritePosition(page, 'VillageInteriorScene', 'world-player-unicorn', 750, 835);
  await page.waitForTimeout(120);
  await page.keyboard.press('e');
  await waitForScene(page, 'MapleBakingActivityScene');

  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:recipe');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-recipe:sunshine');

  await holdMeasure(page, 'h3-r2-baking-measure:flour', 1470);
  await holdMeasure(page, 'h3-r2-baking-measure:milk', 1120);
  await holdMeasure(page, 'h3-r2-baking-measure:sparkle', 860);

  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:mix');
  for (let stir = 0; stir < 24; stir += 1) {
    await page.keyboard.press('ArrowRight');
  }

  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:stack');
  for (const layer of [1, 2, 3]) {
    await clickNamedObject(page, 'MapleBakingActivityScene', `h3-r2-baking-layer:${layer}`);
  }

  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:icing');
  for (let trace = 0; trace < 10; trace += 1) {
    await page.keyboard.press('Space');
  }

  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-topping:clouds');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-topping:clouds');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-finish:ribbon');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-finish:ribbon');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-result');

  const saved = await readSave(page);
  expect(saved.activities.miniGameRecords['minigame:maple-baking-table']).toBe(1);
  expect(saved.collections.discoveryIds).toContain('discovery:sunshine-sprinkle-cake');
  expect(saved.collections.memoryIds).toContain('memory:r65-wp14-maple-baking-first-completion');
  expect(saved.inventory.itemQuantities['item:rainbow-run-sparkle']).toBe(startingBalance + 2);

  await page.keyboard.press('Escape');
  await waitForScene(page, 'VillageInteriorScene');
});

test('WP14 Coral beachcombing records a notebook page and returns safely to the Beach', async ({
  page,
}) => {
  await seedActivityPrerequisites(page);
  await openDiagnostics(page);

  await startScene(page, 'WhisperingWoodsScene');
  await setArcadeSpritePosition(page, 'WhisperingWoodsScene', 'world-player-unicorn', 3180, 1690);
  await waitForScene(page, 'StarlightBeachScene');
  await waitForNamedObject(page, 'StarlightBeachScene', 'wp14-activity-entry:coral-beachcombing');

  await setArcadeSpritePosition(page, 'StarlightBeachScene', 'world-player-unicorn', 1210, 1490);
  await page.waitForTimeout(120);
  await page.keyboard.press('e');
  await waitForScene(page, 'CoralBeachcombingActivityScene');
  await waitForNamedObject(
    page,
    'CoralBeachcombingActivityScene',
    'wp14-beachcombing-trail:crab-tracks',
  );

  for (const index of [1, 2, 3, 4]) {
    await clickNamedObject(
      page,
      'CoralBeachcombingActivityScene',
      `wp14-beachcombing-spot:${index}`,
    );
  }
  await waitForNamedObject(page, 'CoralBeachcombingActivityScene', 'wp14-beachcombing-result');

  const saved = await readSave(page);
  expect(saved.activities.miniGameRecords['minigame:coral-beachcombing']).toBe(1);
  expect(saved.collections.discoveryIds).toContain('discovery:crab-track-notebook-page');
  expect(saved.collections.memoryIds).toContain(
    'memory:r65-wp14-coral-beachcombing-first-completion',
  );
  expect(saved.inventory.itemQuantities['item:rainbow-run-sparkle']).toBe(2);

  await page.keyboard.press('Escape');
  await waitForScene(page, 'StarlightBeachScene');
  await waitForNamedObject(page, 'StarlightBeachScene', 'wp14-activity-entry:coral-beachcombing');
});
