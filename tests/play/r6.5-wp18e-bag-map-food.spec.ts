import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
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
}

test.use({ viewport: { width: 1280, height: 720 }, hasTouch: true });

async function seedLargeInventory(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = '2026-09-06T09:30:00.000Z';
    localStorage.setItem(
      'unicorn-valley.save',
      JSON.stringify({
        schemaVersion: 2,
        createdAt: timestamp,
        lastSavedAt: timestamp,
        profile: {
          name: 'Star',
          appearance: {},
          currentLocationId: 'location:moonflower-glade',
          unlockedAbilityIds: [],
        },
        inventory: {
          itemQuantities: {
            'item:berry-bun': 2,
            'item:willow-moonflower': 1,
            'item:sunbeam-cushion': 1,
            'item:moonflower-lantern': 1,
            'item:cloud-cushion': 1,
            'item:starlight-lamp': 1,
            'item:rainbow-rug': 1,
            'item:sunbeam-picnic-basket': 1,
            'item:hollow-tree-star-jar': 1,
            'item:butterfly-window-charm': 1,
          },
          ownedCosmeticIds: [],
          ownedDecorationIds: [],
          specialItemIds: [],
        },
        relationships: { byCharacterId: {} },
        quests: { byQuestId: {} },
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

async function diagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
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
  await page.waitForFunction((key) => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) ?? false;
  }, sceneKey);
}

async function objectVisible(page: Page, sceneKey: string, objectName: string): Promise<boolean> {
  return page.evaluate(
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

async function clickNamedObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const object = await page.evaluate(
    ({ key, name }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return api
        ?.snapshot()
        .scenes.find((candidate) => candidate.key === key)
        ?.objects.find(
          (candidate) => candidate.name === name && candidate.visible && candidate.interactive,
        );
    },
    { key: sceneKey, name: objectName },
  );
  if (!object) {
    throw new Error(`Interactive ${sceneKey}/${objectName} is not visible.`);
  }
  await clickCanvasLogical(page, object.x, object.y);
}

test('Bag exposes categories, safely scrolls past six items and consumes Food explicitly', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await seedLargeInventory(page);
  await diagnostics(page);
  await startScene(page, 'InventoryScene', { returnScene: 'TitleScene', initialTab: 'items' });

  await waitForObject(page, 'InventoryScene', 'bag-pocket:food');
  await waitForObject(page, 'InventoryScene', 'bag-pocket:decor');
  await clickNamedObject(page, 'InventoryScene', 'bag-pocket:decor');
  await waitForObject(page, 'InventoryScene', 'bag-scroll-down');
  expect(
    await objectVisible(page, 'InventoryScene', 'bag-item-tile:item:sunbeam-picnic-basket'),
  ).toBe(false);

  await clickNamedObject(page, 'InventoryScene', 'bag-scroll-down');
  await waitForObject(page, 'InventoryScene', 'bag-item-tile:item:sunbeam-picnic-basket');

  await clickNamedObject(page, 'InventoryScene', 'bag-pocket:food');
  await waitForObject(page, 'InventoryScene', 'bag-item-tile:item:berry-bun');
  await clickNamedObject(page, 'InventoryScene', 'bag-item-tile:item:berry-bun');
  await waitForObject(page, 'InventoryScene', 'bag-eat-button:item:berry-bun');
  await clickNamedObject(page, 'InventoryScene', 'bag-eat-button:item:berry-bun');
  await waitForObject(page, 'InventoryScene', 'bag-action-feedback');

  const berryBuns = await page.evaluate(() => {
    const raw = localStorage.getItem('unicorn-valley.save');
    if (!raw) {
      return null;
    }
    return JSON.parse(raw).inventory?.itemQuantities?.['item:berry-bun'] ?? 0;
  });
  expect(berryBuns).toBe(1);
});

test('the landscape exploration Map action opens a distinct Map surface rather than a Bag tab', async ({
  page,
}) => {
  await seedLargeInventory(page);
  await diagnostics(page);
  await startScene(page, 'MoonflowerGladeScene');
  await waitForObject(page, 'MoonflowerGladeScene', 'exploration-shell-map-button');

  await clickCanvasLogical(page, 80, 46);
  await waitForObject(page, 'InventoryScene', 'bag-map-current-location');
  expect(await objectVisible(page, 'InventoryScene', 'bag-pocket:food')).toBe(false);
  expect(await objectVisible(page, 'InventoryScene', 'bag-map-guidance')).toBe(true);
});

test('landscape Creator progressively reveals one approved category at a time', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await diagnostics(page);
  await startScene(page, 'UnicornCreatorScene');

  await waitForObject(page, 'UnicornCreatorScene', 'creator-category-colours');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-card-bodyColour-cream');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-action-back');
  await expect(page.locator('.unicorn-name-input')).toBeVisible();
  expect(await objectVisible(page, 'UnicornCreatorScene', 'creator-bodyColour-peach')).toBe(false);
  expect(await objectVisible(page, 'UnicornCreatorScene', 'creator-maneStyle-next')).toBe(false);

  await clickNamedObject(page, 'UnicornCreatorScene', 'creator-category-colours');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-card-bodyColour-cream');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-bodyColour-peach');
  expect(await objectVisible(page, 'UnicornCreatorScene', 'creator-maneStyle-next')).toBe(false);

  await clickNamedObject(page, 'UnicornCreatorScene', 'creator-category-mane');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-card-maneStyle-soft');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-maneStyle-next');
  expect(await objectVisible(page, 'UnicornCreatorScene', 'creator-bodyColour-peach')).toBe(false);

  await clickNamedObject(page, 'UnicornCreatorScene', 'creator-category-horn');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-card-hornStyle-classic');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-hornStyle-next');
  expect(await objectVisible(page, 'UnicornCreatorScene', 'creator-marking-next')).toBe(false);

  await clickNamedObject(page, 'UnicornCreatorScene', 'creator-category-markings');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-card-marking-none');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-marking-next');
  expect(await objectVisible(page, 'UnicornCreatorScene', 'creator-hornStyle-next')).toBe(false);

  await clickNamedObject(page, 'UnicornCreatorScene', 'creator-category-accessories');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-card-accessory-none');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-accessory-next');
  expect(await objectVisible(page, 'UnicornCreatorScene', 'creator-marking-next')).toBe(false);
});
