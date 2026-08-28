import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  x: number;
  y: number;
  interactive: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, payload }) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key, payload);
    },
    { key: sceneKey, payload: data },
  );
  await waitForScene(page, sceneKey);
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const value = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
    if (!value) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return value;
  });
}

function sceneFrom(value: DiagnosticSnapshot, sceneKey: string): DiagnosticScene {
  const scene = value.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostics for ${sceneKey}.`);
  }
  return scene;
}

async function clickLogicalObject(page: Page, objectName: string): Promise<void> {
  const value = await snapshot(page);
  const scene = value.scenes.find((candidate) =>
    candidate.objects.some((object) => object.name === objectName),
  );
  const object = scene?.objects.find((candidate) => candidate.name === objectName);
  const bounds = await page.locator('canvas').boundingBox();
  if (!object || !bounds) {
    throw new Error(`Cannot click ${objectName}.`);
  }

  await page.mouse.click(
    bounds.x + (object.x / value.width) * bounds.width,
    bounds.y + (object.y / value.height) * bounds.height,
  );
}

test('Sunbeam Village shops read as authored open storefronts', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'SunbeamVillageScene');

  const village = sceneFrom(await snapshot(page), 'SunbeamVillageScene');
  for (const shopId of ['bakery', 'accessory-shop', 'library']) {
    expect(
      village.objects.some((object) => object.name === `village-shopfront:${shopId}:wall`),
    ).toBe(true);
    expect(
      village.objects.some((object) => object.name === `village-shopfront:${shopId}:door`),
    ).toBe(true);
    expect(
      village.objects.some((object) => object.name === `village-shopfront:${shopId}:entry-cue`),
    ).toBe(true);
  }
});

test('all three village buildings have distinct usable interiors', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'bakery',
    returnScene: 'SunbeamVillageScene',
  });
  let interior = sceneFrom(await snapshot(page), 'VillageInteriorScene');
  expect(interior.objects.some((object) => object.name === 'village-interior:bakery')).toBe(true);
  expect(interior.objects.some((object) => object.name === 'village-interior-bakery-counter')).toBe(
    true,
  );

  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'library',
    returnScene: 'SunbeamVillageScene',
  });
  interior = sceneFrom(await snapshot(page), 'VillageInteriorScene');
  expect(interior.objects.some((object) => object.name === 'village-interior:library')).toBe(true);
  expect(
    interior.objects.some((object) => object.name === 'village-interior-library-shelves'),
  ).toBe(true);

  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'accessory-shop',
    returnScene: 'SunbeamVillageScene',
  });
  interior = sceneFrom(await snapshot(page), 'VillageInteriorScene');
  expect(interior.objects.some((object) => object.name === 'village-interior:accessory-shop')).toBe(
    true,
  );
  expect(
    interior.objects.some((object) => object.name === 'village-interior-accessory-counter'),
  ).toBe(true);
});

test('Twinkle & Thread opens the real shop and interiors return safely to the village', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'accessory-shop',
    returnScene: 'SunbeamVillageScene',
  });

  await clickLogicalObject(page, 'village-interior-action');
  await waitForScene(page, 'ShopScene');
  expect((await snapshot(page)).activeScenes).toContain('ShopScene');

  await page.keyboard.press('Escape');
  await waitForScene(page, 'VillageInteriorScene');
  await clickLogicalObject(page, 'village-interior-back');
  await waitForScene(page, 'SunbeamVillageScene');
  expect((await snapshot(page)).activeScenes).toContain('SunbeamVillageScene');
});
