import { expect, type Page, test } from '@playwright/test';
import {
  clickNamedObject,
  openDiagnostics,
  setArcadeSpritePosition,
  startScene,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

test.use({ viewport: { width: 412, height: 915 }, hasTouch: true });

async function seedActivityPrerequisites(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = '2026-09-05T08:30:00.000Z';
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

async function expectReadableCompanion(page: Page, id: string): Promise<void> {
  const root = page.locator(`[data-mobile-modal-companion="${id}"]`);
  await expect(root).toBeVisible();

  const introSize = await root
    .locator('.mobile-modal-intro')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(introSize).toBeGreaterThanOrEqual(16);

  const buttons = root.locator('.mobile-modal-button');
  expect(await buttons.count()).toBeGreaterThan(0);
  const metrics = await buttons.evaluateAll((elements) =>
    elements.map((element) => ({
      height: element.getBoundingClientRect().height,
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    })),
  );
  for (const { height, fontSize } of metrics) {
    expect(height).toBeGreaterThanOrEqual(54);
    expect(fontSize).toBeGreaterThanOrEqual(17);
  }
}

test('portrait phone can read and complete Maple baking through large companion controls', async ({
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
  await expectReadableCompanion(page, 'maple-baking');

  const root = page.locator('[data-mobile-modal-companion="maple-baking"]');
  await root.locator('[data-mobile-modal-action="choice-1"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('Pick a topping');
  await root.locator('[data-mobile-modal-action="choice-2"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('finishing touch');
  await root.locator('[data-mobile-modal-action="choice-3"]').click();

  await expect(root.locator('[data-mobile-modal-card="result"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="again"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="back"]')).toBeVisible();
});

test('portrait phone can read and complete Coral beachcombing through large companion controls', async ({
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
  await expectReadableCompanion(page, 'coral-beachcombing');

  const root = page.locator('[data-mobile-modal-companion="coral-beachcombing"]');
  for (const action of ['spot-1', 'spot-2', 'spot-3', 'spot-4']) {
    await root.locator(`[data-mobile-modal-action="${action}"]`).click();
  }

  await expect(root.locator('[data-mobile-modal-card="result"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="again"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="back"]')).toBeVisible();
});

test('portrait phone can read and navigate the expanded Wonderbook without tiny canvas tabs', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await openDiagnostics(page);
  await startScene(page, 'WonderbookScene', { returnScene: 'TitleScene' });
  await expectReadableCompanion(page, 'wonderbook');

  const root = page.locator('[data-mobile-modal-companion="wonderbook"]');
  await expect(root.locator('[data-mobile-modal-action="section-discoveries"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await root.locator('[data-mobile-modal-action="section-places"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('Places');
  await expect(root.locator('[data-mobile-modal-card="region:moonflower-glade"]')).toBeVisible();

  await root.locator('[data-mobile-modal-action="section-goals"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('Long-term Goals');
  await expect(root.locator('[data-mobile-modal-card="goal:valley-explorer"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="close"]')).toBeVisible();
});
