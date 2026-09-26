import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  openDiagnostics,
  setArcadeSpritePosition,
  startScene,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

interface MapleQuestSave {
  inventory: {
    itemQuantities: Record<string, number>;
  };
  quests: {
    byQuestId: Record<string, { status: string; currentStepId: string | null }>;
  };
  world: {
    flags: Record<string, boolean>;
  };
  activities: {
    miniGameRecords: Record<string, number>;
  };
}

async function seedMapleReadyToBake(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = '2026-09-26T15:30:00.000Z';
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
              status: 'active',
              currentStepId: 'quest-step:maple-wobbly-cake-plan:1',
              completedAt: null,
            },
          },
        },
        world: {
          flags: {},
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

async function holdMeasure(page: Page, objectName: string, milliseconds: number): Promise<void> {
  await waitForNamedObject(page, 'MapleBakingActivityScene', objectName);
  await page.keyboard.down('Space');
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up('Space');
}

async function completeMoonflowerCake(page: Page): Promise<void> {
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-stage:recipe');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-recipe:moonflower');

  await holdMeasure(page, 'h3-r2-baking-measure:flour', 1210);
  await holdMeasure(page, 'h3-r2-baking-measure:milk', 1510);
  await holdMeasure(page, 'h3-r2-baking-measure:sparkle', 930);

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

  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-topping:berries');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-topping:berries');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-finish:sprinkles');
  await clickNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-finish:sprinkles');
  await waitForNamedObject(page, 'MapleBakingActivityScene', 'h3-r2-baking-result');
}

test('H3.11-R2 Wobbly Cake plays as a skill mini-game and preserves Maple quest progression', async ({
  page,
}) => {
  await seedMapleReadyToBake(page);
  await openDiagnostics(page);
  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'bakery',
    returnScene: 'SunbeamVillageScene',
  });

  await setArcadeSpritePosition(page, 'VillageInteriorScene', 'world-player-unicorn', 750, 835);
  await page.waitForTimeout(120);
  await page.keyboard.press('e');
  await waitForScene(page, 'MapleBakingActivityScene');

  await completeMoonflowerCake(page);

  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}') as MapleQuestSave,
  );
  expect(saved.quests.byQuestId['quest:maple-wobbly-cake-plan']).toMatchObject({
    status: 'active',
    currentStepId: 'quest-step:maple-wobbly-cake-plan:4',
  });
  expect(saved.world.flags['flag:maple-cake-ready']).toBe(true);
  expect(saved.world.flags['flag:maple-cake-theme-sunshine']).toBe(false);
  expect(saved.world.flags['flag:maple-cake-theme-moonflower']).toBe(true);
  expect(saved.world.flags['flag:maple-cake-theme-rainbow']).toBe(false);
  expect(saved.inventory.itemQuantities['item:wobbly-cake'] ?? 0).toBe(0);
  expect(saved.activities.miniGameRecords['minigame:maple-baking-table']).toBeUndefined();

  await page.keyboard.press('Escape');
  await waitForScene(page, 'VillageInteriorScene');
});
