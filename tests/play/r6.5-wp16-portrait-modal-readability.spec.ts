import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: DiagnosticScene[];
  };
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

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

async function diagnostics(page: Page): Promise<void> {
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
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) ?? false;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are not installed.');
      }
      api.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
  await waitForScene(page, sceneKey);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ key, name }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = api?.snapshot().scenes.find((candidate) => candidate.key === key);
      return scene?.objects.some((object) => object.name === name && object.visible) ?? false;
    },
    { key: sceneKey, name: objectName },
  );
}

async function movePlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, nextX, nextY }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are not installed.');
      }
      api.setArcadeSpritePosition(key, 'world-player-unicorn', nextX, nextY);
    },
    { key: sceneKey, nextX: x, nextY: y },
  );
}

async function clickCanvasLogical(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Game canvas is not visible.');
  }
  await canvas.click({
    position: {
      x: (box.width * x) / 1280,
      y: (box.height * y) / 720,
    },
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
  for (let index = 0; index < (await buttons.count()); index += 1) {
    const button = buttons.nth(index);
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(54);
    const fontSize = await button.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(17);
  }
}

test('portrait phone can read and complete Maple baking through large companion controls', async ({
  page,
}) => {
  await seedActivityPrerequisites(page);
  await diagnostics(page);
  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'bakery',
    returnScene: 'SunbeamVillageScene',
  });
  await waitForObject(page, 'VillageInteriorScene', 'wp14-activity-entry:maple-baking');
  await clickCanvasLogical(page, 1010, 548);
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
  await diagnostics(page);
  await startScene(page, 'WhisperingWoodsScene');
  await movePlayer(page, 'WhisperingWoodsScene', 3180, 1690);
  await waitForScene(page, 'StarlightBeachScene');
  await waitForObject(page, 'StarlightBeachScene', 'wp14-activity-entry:coral-beachcombing');
  await movePlayer(page, 'StarlightBeachScene', 1210, 1490);
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
  await diagnostics(page);
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
