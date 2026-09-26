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

async function readSave(page: Page): Promise<SavedActivityState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}'));
}

test('WP14 Maple baking completes through semantic controls, persists rewards and returns safely', async ({
  page,
}) => {
  await seedActivityPrerequisites(page);
  await openDiagnostics(page);
  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'bakery',
    returnScene: 'SunbeamVillageScene',
  });

  await waitForNamedObject(page, 'VillageInteriorScene', 'wp14-activity-entry:maple-baking');
  await clickNamedObject(page, 'VillageInteriorScene', 'wp14-activity-entry:maple-baking');
  await waitForScene(page, 'MapleBakingActivityScene');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:mix');

  for (let stir = 0; stir < 5; stir += 1) {
    await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-mix-bowl');
  }
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:stack');
  for (const layer of [1, 2, 3]) {
    await clickNamedObject(page, 'MapleBakingActivityScene', `h3-r2-baking-layer:${layer}`);
  }
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:icing');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-icing:sunshine');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-topping:clouds');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-topping:clouds');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-finish:ribbon');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-finish:ribbon');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-result');

  const saved = await readSave(page);
  expect(saved.activities.miniGameRecords['minigame:maple-baking-table']).toBe(1);
  expect(saved.collections.discoveryIds).toContain('discovery:sunshine-sprinkle-cake');
  expect(saved.collections.memoryIds).toContain('memory:r65-wp14-maple-baking-first-completion');
  expect(saved.inventory.itemQuantities['item:rainbow-run-sparkle']).toBe(2);

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
